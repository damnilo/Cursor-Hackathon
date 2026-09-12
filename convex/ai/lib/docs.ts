import { internal } from "../../_generated/api";
import { Doc, Id } from "../../_generated/dataModel";
import { ActionCtx } from "../../_generated/server";
import { findContributingUrl } from "./exa";
import {
  contributingFallbackUrls,
  extractContributingUrls,
  scrapeFirstMarkdown,
  scrapeMarkdown,
} from "./firecrawl";

type ContributingFind = {
  markdown: string | null;
  viaExa: boolean;
};

async function findContributingMarkdown(
  repoUrl: string,
  fullName: string,
  readmeMarkdown: string | null,
): Promise<ContributingFind> {
  const fromReadme = readmeMarkdown
    ? extractContributingUrls(readmeMarkdown, repoUrl)
    : [];
  const fromReadmeHit = await scrapeFirstMarkdown(fromReadme);
  if (fromReadmeHit) {
    return { markdown: fromReadmeHit, viaExa: false };
  }

  const fallbackHit = await scrapeFirstMarkdown(
    contributingFallbackUrls(repoUrl),
  );
  if (fallbackHit) {
    return { markdown: fallbackHit, viaExa: false };
  }

  const exaUrl = await findContributingUrl(fullName);
  if (!exaUrl) {
    return { markdown: null, viaExa: false };
  }
  return {
    markdown: await scrapeMarkdown(exaUrl),
    viaExa: true,
  };
}

export async function loadRepoDocs(
  ctx: ActionCtx,
  repositoryId: Id<"repositories">,
): Promise<Doc<"repoDocuments"> | null> {
  const cached: Doc<"repoDocuments"> | null = await ctx.runQuery(
    internal.ai.store.getRepoDocument,
    { repositoryId },
  );
  if (cached?.readmeMarkdown && cached.contributingMarkdown) {
    return cached;
  }

  const repo: Doc<"repositories"> | null = await ctx.runQuery(
    internal.ai.store.getRepository,
    { repositoryId },
  );
  if (!repo) {
    return cached;
  }

  const readmeMarkdown =
    cached?.readmeMarkdown ?? (await scrapeMarkdown(repo.url));
  const contributingFind = cached?.contributingMarkdown
    ? { markdown: cached.contributingMarkdown, viaExa: false }
    : await findContributingMarkdown(repo.url, repo.fullName, readmeMarkdown);
  const contributingMarkdown = contributingFind.markdown;

  const enriched = Boolean(readmeMarkdown || contributingMarkdown);

  await ctx.runMutation(internal.ai.store.upsertRepoDocument, {
    repositoryId,
    readmeMarkdown: readmeMarkdown ?? undefined,
    contributingMarkdown: contributingMarkdown ?? undefined,
    source: enriched ? "firecrawl" : "none",
    note: contributingMarkdown
      ? contributingFind.viaExa
        ? "README + CONTRIBUTING (Exa found the file URL, Firecrawl scraped it)."
        : "Scraped README and CONTRIBUTING with Firecrawl."
      : readmeMarkdown
        ? "README scraped; no CONTRIBUTING found."
        : "Firecrawl returned no docs; matching can continue without enrichment.",
  });

  const saved: Doc<"repoDocuments"> | null = await ctx.runQuery(
    internal.ai.store.getRepoDocument,
    { repositoryId },
  );
  return saved;
}
