"use node";

// OWNER: colleague (AI). Replace this stub with PDF text + Grok → catalog chips.
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Infer, v } from "convex/values";
import { studentProfileValidator } from "../lib/validators";

type ParsedProfile = Infer<typeof studentProfileValidator>;

export const parseCv = action({
  args: { sessionId: v.string() },
  returns: v.union(studentProfileValidator, v.null()),
  handler: async (ctx, args): Promise<ParsedProfile | null> => {
    const profile = await ctx.runQuery(api.profiles.getBySession, {
      sessionId: args.sessionId,
    });
    if (!profile?.cvStorageId) {
      console.error("parseCv: no CV on this profile yet");
      return null;
    }
    // Colleague: download profile.cvStorageId, pdf-parse, grokJson onto catalog.
    console.error("parseCv: stub — implement PDF + Grok mapping to catalog chips");
    return null;
  },
});
