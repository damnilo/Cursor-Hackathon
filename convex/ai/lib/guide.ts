const SECTION =
  /\b(contribut|getting started|development|pull requests?|how to|set ?up|prerequisites|building from source|testing)\b/i;

function cleanInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function pushStep(steps: string[], section: string, text: string) {
  const body = cleanInline(text);
  if (body.length < 8 || body.length > 220) {
    return;
  }
  if (/^read the readme\.?$/i.test(body)) {
    return;
  }
  const line = section ? `${section}: ${body}` : body;
  if (!steps.includes(line)) {
    steps.push(line);
  }
}

function stepsInMarkdown(markdown: string): string[] {
  const steps: string[] = [];
  let capture = false;
  let section = "";
  let level = 0;
  let fence: string[] | null = null;

  for (const raw of markdown.split("\n")) {
    const line = raw.trimEnd();
    if (fence) {
      if (line.trim().startsWith("```")) {
        const commands = fence
          .map((item) => item.trim())
          .filter((item) => item.length > 0 && !item.startsWith("#"));
        if (
          commands.length > 0 &&
          commands.length <= 3 &&
          commands.every((item) => item.length < 100)
        ) {
          pushStep(steps, section, `Run \`${commands.join(" && ")}\``);
        }
        fence = null;
      } else {
        fence.push(line);
      }
      continue;
    }
    if (line.trim().startsWith("```")) {
      fence = [];
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (heading) {
      const thisLevel = heading[1].length;
      const title = heading[2].trim();
      if (SECTION.test(title)) {
        capture = true;
        section = cleanInline(title).slice(0, 60);
        level = thisLevel;
      } else if (capture && thisLevel <= level) {
        capture = false;
      }
      continue;
    }

    if (!capture) {
      continue;
    }
    const item = /^\s*(?:[-*+]|\d+[.)])\s+(.+)$/.exec(line);
    if (item) {
      pushStep(steps, section, item[1]);
    }
  }

  return steps;
}

/** Headings, lists, and commands from a repo's own newcomer docs. */
export function guideStepsFromDocs(
  readme: string | null | undefined,
  contributing: string | null | undefined,
): string[] {
  const steps: string[] = [];
  for (const source of [contributing, readme]) {
    if (!source) {
      continue;
    }
    for (const step of stepsInMarkdown(source)) {
      if (!steps.includes(step)) {
        steps.push(step);
      }
      if (steps.length >= 6) {
        return steps;
      }
    }
  }
  return steps;
}
