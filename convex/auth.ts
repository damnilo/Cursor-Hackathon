import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { isAllowedRedirect } from "./lib/redirectAllow";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      const siteUrl = process.env.SITE_URL;
      if (isAllowedRedirect(redirectTo, siteUrl)) {
        return redirectTo;
      }
      return siteUrl ?? "http://localhost:3000";
    },
  },
});

