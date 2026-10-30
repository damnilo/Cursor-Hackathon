export const CHIP_MEMORY_MS = 7 * 24 * 60 * 60 * 1000;

/** True when the saved chip choice is too old to show again. */
export function chipsAreStale(
  updatedAt: number | undefined,
  now = Date.now(),
): boolean {
  return typeof updatedAt === "number" && now - updatedAt > CHIP_MEMORY_MS;
}
