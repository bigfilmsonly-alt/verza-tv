import type { Show, Episode, Article } from "./schemas";

export interface ContentSource {
  listShows(filter?: { category?: string; limit?: number }): Show[];
  getShow(slug: string): Show | undefined;
  listEpisodes(showSlug: string): Episode[];
  getEpisode(showSlug: string, n: number): Episode | undefined;
  listArticles(): Article[];
  getArticle(slug: string): Article | undefined;
  getInternalLinks(slug: string): { targetSlug: string; anchorText: string }[];
}
