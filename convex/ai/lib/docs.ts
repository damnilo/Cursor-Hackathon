import { internal } from "../../_generated/api";
import { Doc, Id } from "../../_generated/dataModel";
import { ActionCtx } from "../../_generated/server";
import { contributingUrl, scrapeMarkdown } from "./firecrawl";

export async function loadRepoDocs(
  ctx: ActionCtx,
  repositoryId: Id<"repositories">,
): Promise<Doc<"repoDocuments"> | null> {
  const cached: Doc<"repoDocuments"> | null = await ctx.runQuery(
    internal.ai.store.getRepoDocument,
    { repositoryId },
  );
  if (cached?.source === "firecrawl" && cached.readmeMarkdown) {
    return cached;
  }

  const repo: Doc<"repositories"> | null = await ctx.runQuery(
    internal.ai.store.getRepository,
    { repositoryId },
  );
  if (!repo) {
    return cached;
  }

  const readmeMarkdown = await scrapeMarkdown(repo.url);
  const contributingMarkdown = await scrapeMarkdown(contributingUrl(repo.url));
  const enriched = Boolean(readmeMarkdown || contributingMarkdown);

  await ctx.runMutation(internal.ai.store.upsertRepoDocument, {
    repositoryId,
    readmeMarkdown: readmeMarkdown ?? undefined,
    contributingMarkdown: contributingMarkdown ?? undefined,
    source: enriched ? "firecrawl" : "none",
    note: enriched
      ? "Scraped with Firecrawl."
      : "Firecrawl returned no docs; matching can continue without enrichment.",
  });

  const saved: Doc<"repoDocuments"> | null = await ctx.runQuery(
    internal.ai.store.getRepoDocument,
    { repositoryId },
  );
  return saved;
}
