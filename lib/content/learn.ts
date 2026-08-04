/**
 * Educational / Authority Content Pages
 * Human-quality, original content about the micro-drama industry.
 * editorialApproved gates indexability per SEO governance.
 */

export interface LearnPage {
  slug: string;
  title: string;
  description: string;
  body: string;
  editorialApproved: boolean;
}

export const LEARN_PAGES: LearnPage[] = [
  {
    slug: "what-is-a-micro-drama",
    title: "What Is a Micro-Drama?",
    description:
      "Micro-dramas are short-form serialized stories delivered in brief episodes. Learn how the phone-first format works and how runtimes can vary.",
    body: `A micro-drama is a serialized story told in brief episodes designed for mobile viewing. Runtime, aspect ratio, and season length vary across titles and services.

The format became prominent through mobile-first services and has expanded across markets. This guide does not rely on unverified audience or revenue estimates.

Micro-dramas are designed for brief phone-viewing sessions. Serialized chapters often use unresolved story beats to connect one episode to the next.

VERZA TV's core microdramas use a vertical 9:16 format and short serialized episodes, while reality, music, podcast, red-carpet, and other titles can use different formats and lengths. Each live title page identifies the episodes currently available free before any paid access begins.`,
    editorialApproved: true,
  },
  {
    slug: "what-is-vertical-entertainment",
    title: "What Is Vertical Entertainment?",
    description:
      "Vertical entertainment is content produced in portrait (9:16) format for mobile-first viewing. Learn why it's the future of streaming.",
    body: `Vertical entertainment refers to video content produced in portrait orientation — the 9:16 aspect ratio that fills a phone screen when held naturally. Instead of turning your phone sideways, the content comes to you.

This format was popularized by TikTok, Instagram Reels, and YouTube Shorts for short clips. Vertical entertainment takes it further by applying the format to scripted, serialized storytelling with professional production values.

The key insight is that most video consumption now happens on mobile devices. Traditional 16:9 content leaves over 40% of the phone screen unused. Vertical content fills the entire display, creating a more immersive, focused viewing experience.

Many VERZA TV microdramas are composed for a vertical screen rather than cropped from widescreen footage. Other catalog categories can use a different aspect ratio or production style, so check the selected title rather than assuming every program has the same format.`,
    editorialApproved: true,
  },
  {
    slug: "how-vertical-series-work",
    title: "How Vertical Series Work",
    description:
      "From production to your phone: how VERZA TV delivers short-form vertical series.",
    body: `A vertical series on VERZA TV is a serialized story told across multiple short episodes, each filmed in 9:16 portrait format. Here's how it works:

Production: Production and licensing vary by title. Core microdramas are structured as short serialized chapters, often using cliffhangers to connect episodes.

Format: Episode length, aspect ratio, and episode count vary by title. The selected series page is the authority for its current episode list.

Distribution: Episodes are streamed via Mux using adaptive HLS video. Each live title identifies its current free-access limit. On supported purchase surfaces, eligible titles offer a $1.99 one-time Series Unlock for remaining available episodes; a VIP plan provides paid access while active only when that plan is currently displayed on the purchase surface.

Viewing: Series are designed for binge-watching. When one episode ends, the next auto-plays. The vertical format means you never need to rotate your phone — just hold it naturally and watch.`,
    editorialApproved: true,
  },
];

export function getLearnPage(slug: string): LearnPage | undefined {
  return LEARN_PAGES.find((p) => p.slug === slug);
}
