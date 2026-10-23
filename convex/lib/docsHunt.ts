/** A finished hunt is not scraped again, including a recorded miss. */
export function docsHuntFinished(doc: {
  contributingMarkdown?: string;
  source: string;
  note: string;
} | null): boolean {
  if (!doc) {
    return false;
  }
  return Boolean(
    doc.contributingMarkdown ||
      doc.source === "none" ||
      doc.note.includes("no CONTRIBUTING") ||
      doc.note.includes("no docs"),
  );
}
