/** True when this tab is the one that last saved the chips. */
export function sameVisit(
  stored: string | undefined,
  visitId: string | undefined,
): boolean {
  return (
    typeof stored === "string" &&
    stored.length >= 8 &&
    typeof visitId === "string" &&
    visitId.length >= 8 &&
    stored === visitId
  );
}
