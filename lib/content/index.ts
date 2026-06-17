import type { ContentSource } from "./source";
import { createCodeContentSource } from "./code-source";

const source: ContentSource = (() => {
  const type = process.env.CONTENT_SOURCE || "code";
  if (type === "supabase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseContentSource } = require("./supabase-source");
    return createSupabaseContentSource();
  }
  return createCodeContentSource();
})();

export const content = source;
export type { ContentSource };
export type { Show, Episode, Article, Person } from "./schemas";
