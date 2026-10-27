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

/** Path and query, or null when the value is not a same-site path. */
export function redirectPath(redirectTo: string): string | null {
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return redirectTo;
  }
  return null;
}

/**
 * Absolute URL the browser can open after Google sign-in.
 * A path stays on that path even when SITE_URL is unset.
 */
export function redirectDestination(
  redirectTo: string,
  siteUrl: string | undefined,
): string {
  const base = (siteUrl ?? "http://localhost:3000").replace(/\/$/, "");
  const path = redirectPath(redirectTo);
  if (path) {
    return `${base}${path}`;
  }
  if (isAllowedRedirect(redirectTo, siteUrl)) {
    return redirectTo;
  }
  return base;
}
