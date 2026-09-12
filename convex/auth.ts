import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

function isAllowedRedirect(redirectTo: string): boolean {
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    return true;
  }
  const siteUrl = process.env.SITE_URL;
  if (siteUrl && redirectTo.startsWith(siteUrl)) {
    return true;
  }
  try {
    const url = new URL(redirectTo);
    const local =
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:");
    const render =
      url.protocol === "https:" && url.hostname.endsWith(".onrender.com");
    return local || render;
  } catch {
    return false;
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      if (isAllowedRedirect(redirectTo)) {
        return redirectTo;
      }
      return process.env.SITE_URL ?? "http://localhost:3000";
    },
  },
});

