/**
 * Genre Hub Definitions
 * Each genre has a slug, display name, description, and related tags.
 * editorialApproved gates indexability per SEO governance.
 */

export interface GenreHub {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  editorialApproved: boolean;
}

export const GENRE_HUBS: GenreHub[] = [
  {
    slug: "romance",
    name: "Romance",
    description:
      "Fall into love stories that unfold in minutes. From billionaire romances to secret affairs, Verza TV delivers cinematic romance in vertical micro-drama format — every episode a new twist, every series a new obsession.",
    tags: ["romance", "love", "billionaire", "drama"],
    editorialApproved: true,
  },
  {
    slug: "billionaire-romance",
    name: "Billionaire Romance",
    description:
      "Luxury, power, and forbidden love. Verza TV's billionaire romance series feature CEO love interests, secret identities, and glamorous settings — all told in binge-worthy micro-episodes designed for your phone.",
    tags: ["billionaire", "ceo", "romance", "luxury"],
    editorialApproved: true,
  },
  {
    slug: "revenge-drama",
    name: "Revenge Drama",
    description:
      "Betrayal demands justice. Watch characters plot their comeback in intense revenge dramas packed with twists, deception, and satisfying payoffs — each episode under two minutes.",
    tags: ["revenge", "drama", "thriller", "betrayal"],
    editorialApproved: true,
  },
  {
    slug: "mystery",
    name: "Mystery",
    description:
      "Unravel secrets one episode at a time. Verza TV mystery series keep you guessing with cliffhangers, red herrings, and reveals — all in vertical micro-drama format.",
    tags: ["mystery", "suspense", "thriller", "whodunit"],
    editorialApproved: true,
  },
  {
    slug: "thriller",
    name: "Thriller",
    description:
      "Heart-pounding tension in every swipe. From psychological thrillers to action-packed series, Verza TV delivers edge-of-your-seat entertainment in 60-second episodes.",
    tags: ["thriller", "suspense", "action", "drama"],
    editorialApproved: true,
  },
];

export function getGenreHub(slug: string): GenreHub | undefined {
  return GENRE_HUBS.find((g) => g.slug === slug);
}
