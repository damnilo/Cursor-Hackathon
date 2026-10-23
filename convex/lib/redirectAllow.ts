const DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

/** Relative paths and the exact site origin. Not a prefix and not every Render host. */
export function isAllowedRedirect(
  redirectTo: string,
  siteUrl: string | undefined,
): boolean {
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return true;
  }
  let url: URL;
  try {
    url = new URL(redirectTo);
  } catch {
    return false;
  }
  if (DEV_ORIGINS.has(url.origin)) {
    return true;
  }
  if (!siteUrl) {
    return false;
  }
  try {
    return url.origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}
