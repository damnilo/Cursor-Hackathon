import { query } from "./_generated/server";
import { v } from "convex/values";

export const ping = query({
  args: {},
  returns: v.object({
    status: v.string(),
    timestamp: v.number(),
  }),
  handler: async () => ({
    status: "ok",
    timestamp: Date.now(),
  }),
});
