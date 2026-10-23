import { ConvexError } from "convex/values";

/** User-facing limit text. Other failures stay on a short fallback, not a stack. */
export function actionNotice(caught: unknown): string | null {
  if (caught instanceof ConvexError && typeof caught.data === "string") {
    return caught.data;
  }
  return null;
}
