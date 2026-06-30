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
      "Micro-dramas are short-form serialized stories told in episodes of 60 to 120 seconds. Learn how this format is changing entertainment.",
    body: `A micro-drama is a serialized story told in very short episodes — typically 60 to 120 seconds each. Unlike traditional TV episodes that run 22 to 60 minutes, micro-dramas deliver complete narrative beats in under two minutes, designed for mobile viewing.

The format originated in China, where apps like ShortTV and ReelShort popularized vertical micro-dramas with millions of daily viewers. The global micro-drama market has grown rapidly, with projections reaching billions in annual revenue.

Micro-dramas work because they match how people actually use their phones: in short bursts, during commutes, breaks, and downtime. Each episode ends on a cliffhanger that drives the viewer to the next, creating a binge pattern that fits into any schedule.

On Verza TV, every series follows this format: vertical 9:16 episodes, each under two minutes, with serialized storylines across genres including romance, thriller, revenge drama, mystery, and more. The first five episodes of every series are free.`,
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

Verza TV produces all content in vertical format with cinema-quality production. Every frame is composed for the vertical screen, not cropped from horizontal footage. This intentional approach to vertical storytelling is what sets the platform apart.`,
    editorialApproved: true,
  },
  {
    slug: "how-vertical-series-work",
    title: "How Vertical Series Work",
    description:
      "From production to your phone: how Verza TV creates and delivers vertical micro-drama series with cinema-quality production.",
    body: `A vertical series on Verza TV is a serialized story told across multiple short episodes, each filmed in 9:16 portrait format. Here's how it works:

Production: Every series is produced at Filmology Labs, a $250M production facility in Paterson, New Jersey, equipped with 21 soundstages and an LED volume wall for virtual production. Scripts are written specifically for the micro-drama format, with each episode designed to end on a cliffhanger.

Format: Episodes run 60 to 120 seconds each. A typical series has 60 to 100 episodes, telling a complete story arc. The short episode length makes production efficient while keeping audiences engaged.

Distribution: Episodes are streamed via Mux, delivering adaptive-quality HLS video that adjusts to your connection speed. The first five episodes of every series are free. To continue watching, viewers can unlock the full series for $2 (Summer Sale) or subscribe to VIP for unlimited access to the entire library.

Viewing: Series are designed for binge-watching. When one episode ends, the next auto-plays. The vertical format means you never need to rotate your phone — just hold it naturally and watch.`,
    editorialApproved: true,
  },
];

export function getLearnPage(slug: string): LearnPage | undefined {
  return LEARN_PAGES.find((p) => p.slug === slug);
}
