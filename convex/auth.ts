import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { redirectDestination } from "./lib/redirectAllow";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      return redirectDestination(redirectTo, process.env.SITE_URL);
    },
  },
});

