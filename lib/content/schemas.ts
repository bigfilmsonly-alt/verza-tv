import { z } from "zod";

// Category enum
export const CategoryEnum = z.enum(["drama", "new", "popular", "reality", "music", "red-carpet"]);
export type Category = z.infer<typeof CategoryEnum>;

// Person
export const PersonSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  role: z.enum(["actor", "creator", "host"]),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
});
export type Person = z.infer<typeof PersonSchema>;

// Show
export const ShowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  synopsis: z.string(),
  genre: z.array(z.string()),
  tags: z.array(z.string()),
  posterUrl: z.string(),
  year: z.number(),
  rating: z.number(),
  cast: z.array(PersonSchema),
  episodeCount: z.number(),
  category: CategoryEnum,
  status: z.enum(["live", "coming_soon"]),
  indexable: z.boolean(),
  createdAt: z.string(),
});
export type Show = z.infer<typeof ShowSchema>;

// Season
export const SeasonSchema = z.object({
  id: z.string(),
  showSlug: z.string(),
  number: z.number().default(1),
  episodeCount: z.number(),
});
export type Season = z.infer<typeof SeasonSchema>;

// Episode
export const EpisodeSchema = z.object({
  id: z.string(),
  showSlug: z.string(),
  number: z.number(),
  title: z.string(),
  synopsis: z.string(),
  durationSeconds: z.number(),
  muxPlaybackId: z.string(),
  posterUrl: z.string(),
  isFree: z.boolean(),
  unlockCoins: z.number(),
  transcript: z.string().nullable().optional(),
  indexable: z.boolean(),
  createdAt: z.string(),
});
export type Episode = z.infer<typeof EpisodeSchema>;

// Article
export const ArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  body: z.string(),
  showSlugs: z.array(z.string()),
  tags: z.array(z.string()),
  publishedAt: z.string(),
  indexable: z.boolean(),
});
export type Article = z.infer<typeof ArticleSchema>;

// Parse helpers
export function parseShow(data: unknown): Show {
  return ShowSchema.parse(data);
}
export function parseEpisode(data: unknown): Episode {
  return EpisodeSchema.parse(data);
}
export function parsePerson(data: unknown): Person {
  return PersonSchema.parse(data);
}
export function parseArticle(data: unknown): Article {
  return ArticleSchema.parse(data);
}
