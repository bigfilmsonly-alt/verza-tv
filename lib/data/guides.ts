/**
 * GUIDES — long-form informational / answer-engine (AEO) content.
 * Each guide is original editorial prose about the micro-drama format,
 * how VERZA TV works, and how to get the most out of vertical drama.
 */

export interface Guide {
  slug: string;
  title: string;
  /** 150-160 char meta description */
  blurb: string;
  /** 80-150 word introduction */
  intro: string;
  /** 3-6 real sections, ~60-120 words each */
  sections: { heading: string; body: string }[];
  /** 3-5 frequently asked questions */
  faq: { question: string; answer: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "what-is-a-microdrama",
    title: "What Is a Microdrama? A Complete Guide",
    blurb:
      "A microdrama is a serialized story told in brief, often phone-first episodes. Learn how the format works and how runtimes vary across titles.",
    intro:
      "A microdrama is a scripted, serialized story delivered in brief chapters, often composed vertically for a phone screen. Runtime, aspect ratio, and season length vary across titles and services. This guide explains the format, how it differs from standalone social clips, and which details viewers should check on a title page instead of assuming every microdrama follows one fixed template.",
    sections: [
      {
        heading: "The basic definition",
        body: "A microdrama is a serialized drama delivered in brief chapters. Unlike a film or traditional long-form episode, each installment can focus on one emotional or plot beat before continuing into the next. Many titles use vertical framing and cliffhangers, but runtime, orientation, episode count, and pacing are not universal and should be checked title by title.",
      },
      {
        heading: "How microdramas differ from short clips",
        body: "TikToks, Reels, and YouTube Shorts are often standalone moments. A microdrama instead uses recurring characters and an ongoing narrative across multiple chapters. The exact season length varies, but continuity between episodes is what distinguishes the format from a loose collection of clips.",
      },
      {
        heading: "Why the format works",
        body: "Microdramas fit the way people actually use phones: in fragments, between other things, with sound or without. Each episode is short enough to start on a whim and structured to make stopping hard. The vertical frame fills the whole screen, so there is no letterboxing and no need to rotate the device. And because seasons are long, a story you like can keep you engaged for hours of total runtime, delivered in pieces you can pick up and put down anywhere — a commute, a coffee line, the last few minutes before sleep.",
      },
      {
        heading: "Who makes microdramas",
        body: "The format was pioneered by Chinese studios and apps, then spread globally through platforms producing English-language series. VERZA TV is a US-based short-form streaming service with a growing catalog spanning romance, thriller, revenge, mystery, reality, music, podcasts, and red-carpet programming. Production values across the category have climbed quickly — real actors, scripts, cinematography, and scoring — so today's microdramas can look far closer to streaming television than to a casual phone video.",
      },
    ],
    faq: [
      {
        question: "How long is one microdrama episode?",
        answer:
          "There is no single required runtime. Microdramas use brief serialized episodes, but length and season size vary by title and service; check the selected title's episode list for current details.",
      },
      {
        question: "Are microdramas the same as TikTok videos?",
        answer:
          "No. They share a vertical format and short runtime, but microdramas are scripted, serialized stories with recurring characters and season-long arcs, where social clips are usually standalone moments.",
      },
      {
        question: "Where can I watch microdramas?",
        answer:
          "You can watch microdramas on dedicated platforms like VERZA TV in a browser or supported app. Each live VERZA series page shows the episodes currently available free before any paid access begins, and some short titles are wholly free.",
      },
    ],
  },
  {
    slug: "how-to-watch-vertical-dramas",
    title: "How to Watch Vertical Dramas",
    blurb:
      "A practical guide to watching vertical dramas: where to start, how the swipe interface works, and how to get the best viewing experience on any phone.",
    intro:
      "Vertical dramas are designed to be watched the way you hold your phone — upright, in portrait, with the picture filling the entire screen. If you have ever felt a twinge of guilt rotating your phone for a YouTube video, vertical drama removes the friction entirely. But the format has its own rhythms and controls, and knowing them makes the experience smoother. This guide walks through how to start watching, how the interface works, and a few small habits that make a binge feel effortless on any device.",
    sections: [
      {
        heading: "Pick a series and start the free episodes",
        body: "Begin by browsing a catalog and choosing a series whose poster or logline grabs you. On VERZA TV, each live series displays its free opening episodes so you can sample the story before committing. Tap the poster, choose an available episode, and start watching. There is no need to create an account just to sample free episodes, which makes short-form drama a low-friction format to try.",
      },
      {
        heading: "Master the swipe",
        body: "Vertical drama interfaces often borrow from familiar social feeds. On VERZA TV, swipe up to advance to the next vertical episode and swipe down to go back; player controls handle pause and sound. Horizontal titles use their own player controls. Interaction frequency depends on the selected title's actual episode length.",
      },
      {
        heading: "Sound, captions, and autoplay",
        body: "Many vertical players start muted so they can autoplay politely, then let you unmute with a tap. Once you unmute, the choice usually sticks for the rest of your session. If you are watching in public or in bed, captions keep the story readable without sound. Autoplay chains episodes together, so a binge can run hands-free until you decide to stop. Adjusting these small settings at the start of a session means you rarely have to touch them again.",
      },
      {
        heading: "Get the best picture on your device",
        body: "Vertical dramas are shot in 9:16, the native shape of a modern phone screen, so they look sharpest on a phone held upright. On a tablet or desktop, the player keeps the vertical frame centered rather than stretching it, which preserves the intended composition. A stable connection matters more than a huge screen: short episodes load fast, but autoplay binges benefit from steady bandwidth. For the most immersive experience, full-screen on a phone with captions on is hard to beat.",
      },
    ],
    faq: [
      {
        question: "Do I need an app to watch vertical dramas?",
        answer:
          "Not necessarily. VERZA TV streams vertical dramas directly in your mobile or desktop browser, so you can start watching the free episodes without installing anything.",
      },
      {
        question: "How do I move to the next episode?",
        answer:
          "Swipe up to advance to the next episode and swipe down to return to the previous one. A single tap typically pauses and resumes the current episode.",
      },
      {
        question: "Why does playback start muted?",
        answer:
          "Vertical players often start muted so episodes can autoplay smoothly. Tap to unmute, and on most platforms your sound preference is remembered for the rest of the session.",
      },
    ],
  },
  {
    slug: "glossary",
    title: "Microdrama Glossary: Key Terms Explained",
    blurb:
      "A plain-English glossary of microdrama terms — from cliffhanger and binge to coins, vertical, and serialized arc. Understand the language of vertical drama.",
    intro:
      "Like any growing medium, microdramas have developed their own vocabulary — borrowed partly from television, partly from social video, and partly from gaming and app economics. If you are new to vertical drama, a few of these words can be confusing. This glossary defines the terms you will encounter most often, in plain language, so you can read about microdramas, talk about them, and navigate platforms like VERZA TV without guessing. Each entry is short on purpose: a clear definition you can scan.",
    sections: [
      {
        heading: "Microdrama",
        body: "A serialized drama told in brief episodes, often using vertical framing for phone viewing. Runtime, aspect ratio, and season size vary by title. The term is sometimes written micro-drama or short drama.",
      },
      {
        heading: "Vertical (9:16)",
        body: "Vertical refers to portrait-orientation video shaped 9:16, the native proportions of a phone held upright. Vertical content fills the entire screen with no black bars, unlike traditional 16:9 video that leaves the top and bottom of a portrait phone empty. Shooting vertically is a deliberate creative choice that frames faces and close-ups for an intimate, phone-first viewing experience.",
      },
      {
        heading: "Cliffhanger",
        body: "An unresolved, suspenseful moment placed at the end of an episode to encourage continued viewing. Cliffhangers are common in serialized storytelling, but their frequency and style vary by series.",
      },
      {
        heading: "Binge",
        body: "Watching many episodes back to back in a single session. Microdramas are engineered for bingeing — short episodes plus relentless cliffhangers plus autoplay make it easy to watch twenty episodes without noticing. Because each episode is brief, a binge can feel light and casual even when it covers a large chunk of a season.",
      },
      {
        heading: "Coins",
        body: "A virtual currency used on many microdrama platforms to unlock episodes beyond the free ones. You buy coins in packs and spend them per episode or per series. VERZA TV's current checkout does not sell or spend coins; eligible VERZA titles instead offer a flat one-time Series Unlock alongside optional VIP access.",
      },
      {
        heading: "Serialized arc",
        body: "The season-long storyline that connects every episode into one continuous narrative. A serialized arc is what separates a microdrama from a loose collection of clips: characters carry over, stakes rise, and earlier episodes set up later payoffs. Following the arc — not any single episode — is the reason viewers keep returning across an entire season.",
      },
    ],
    faq: [
      {
        question: "Is microdrama the same as short drama?",
        answer:
          "Yes. Microdrama, micro-drama, vertical drama, and short drama are interchangeable terms for the same format: serialized stories told in very short, vertically shot episodes.",
      },
      {
        question: "What does 9:16 mean?",
        answer:
          "9:16 is the aspect ratio of a vertical, portrait-oriented video — the natural shape of a phone screen held upright. Microdramas are shot in 9:16 so the picture fills the whole display.",
      },
      {
        question: "What are coins used for?",
        answer:
          "Coins are a virtual currency you buy in packs and spend to unlock episodes beyond the free ones. They let you pay per story instead of committing to a fixed monthly subscription.",
      },
    ],
  },
  {
    slug: "how-coins-work",
    title: "How Coins Work on Microdrama Apps",
    blurb:
      "Coins are the virtual currency that unlocks microdrama episodes. Learn how coin packs, per-episode pricing, and bonus coins work — and how to spend wisely.",
    intro:
      "If you have started watching microdramas, you have probably hit the moment where the free episodes end and the app asks you to spend coins. Coins are the most common way microdrama platforms charge for content, and they work differently from a traditional subscription. Instead of paying a flat monthly fee for everything, you buy coins in packs and spend them on the specific stories you want to finish. This guide explains how the coin model works, why platforms use it, and how to get the most value from every pack.",
    sections: [
      {
        heading: "What coins are",
        body: "Coins are a prepaid virtual currency. You buy them in bundles — small packs for casual viewing, larger packs for heavy bingeing — and the platform credits your account. Coins do not expire mid-binge, and any bonus coins included in a pack are added on top. Because coins are decoupled from real-money price at the point of spending, they let a platform offer flexible pricing: a long season and a short one can cost different amounts of coins, and you only spend on what you watch.",
      },
      {
        heading: "How you spend coins",
        body: "After the free episodes of a series, additional episodes cost coins. Some platforms charge per episode; others let you unlock an entire series at once for a coin total, which usually works out cheaper than buying episode by episode. When you choose to unlock, the coins are deducted from your balance and that content stays available to you. Because you decide which stories to unlock, your spending tracks exactly what you enjoy rather than a flat fee for a whole catalog.",
      },
      {
        heading: "Coin packs and bonus coins",
        body: "Coin packs scale: bigger packs cost more but include proportionally more bonus coins, lowering the effective price per coin. A starter pack is fine for trying the format, while a larger pack is better value if you know you binge often. The bonus coins are the key to value — a pack labeled best value typically bundles a large bonus that makes each unlock cheaper. It pays to glance at the bonus amounts before choosing, rather than always grabbing the smallest pack.",
      },
      {
        heading: "Coins versus subscriptions",
        body: "Coins suit viewers on coin-based platforms who watch selectively, while subscriptions suit viewers who watch broadly. VERZA TV currently uses a simpler comparison: a flat one-time Series Unlock for one eligible story versus VIP access when a recurring plan is available on the supported checkout surface. Compare the total cost of the specific series you expect to finish with the recurring VIP price shown there.",
      },
    ],
    faq: [
      {
        question: "Do coins expire?",
        answer:
          "On most platforms, coins remain in your balance until you spend them, including bonus coins from a pack. Always check the specific platform's terms, but coins are generally not consumed unless you unlock content.",
      },
      {
        question: "Is it cheaper to unlock a whole series at once?",
        answer:
          "Often, yes. Many platforms offer a discounted coin total to unlock an entire series compared with buying each episode individually, so a full-series unlock is usually the better value if you plan to finish it.",
      },
      {
        question: "Are coins or a subscription better value?",
        answer:
          "Coins are better if you watch selectively and only finish a few series. A subscription or VIP membership is better if you binge widely across many titles, since it unlocks everything for a single recurring price.",
      },
    ],
  },
  {
    slug: "are-microdramas-free",
    title: "Are Microdramas Free to Watch?",
    blurb:
      "Yes, you can start microdramas for free. Learn how free episodes, coins, and VIP memberships fit together — and how to watch the most without paying.",
    intro:
      "One of the first questions new viewers ask is whether microdramas cost money. The honest answer is: you can start any series for free, and finishing the ones you love usually costs a little. Microdrama platforms use a freemium model — generous free episodes to hook you, then coins or a membership to continue. This guide breaks down exactly what is free, what is paid, and how to stretch the free tier as far as it goes so you only spend on stories you are genuinely invested in.",
    sections: [
      {
        heading: "What you get for free",
        body: "On VERZA TV, every live series page identifies the episodes currently available without payment, and several short titles are wholly free. Those episodes are part of the actual program rather than separate trailers, so you can judge a story before deciding whether you want paid access to the remaining available episodes.",
      },
      {
        heading: "When microdramas cost money",
        body: "After an eligible series' free episodes, you can buy its remaining available episodes with a $1.99 one-time Series Unlock on a supported purchase surface, or choose a VIP plan when one is displayed there. Browsing and sampling free episodes do not trigger a charge; Stripe shows the selected title, price, and recurring terms, if any, before payment.",
      },
      {
        heading: "How to watch the most for free",
        body: "To make the most of free access, sample the episodes marked free across several series and use the wholly free titles too. The series page tells you where paid access begins, so you can judge pacing and tone before choosing a one-time Series Unlock or a VIP subscription.",
      },
      {
        heading: "Free episodes versus VIP",
        body: "If you only dip in occasionally, free episodes plus an occasional one-time Series Unlock may be enough. If you watch paid titles broadly, VIP provides access while the subscription remains active. The supported purchase surface shows which VIP plan, if any, is currently available together with its price and renewal terms.",
      },
    ],
    faq: [
      {
        question: "Can I watch microdramas without paying anything?",
        answer:
          "Yes. Each live VERZA TV series identifies its free episodes, and several short titles are wholly free, so you can watch without creating a payment account.",
      },
      {
        question: "Are the free episodes just previews?",
        answer:
          "No. The free episodes are the actual opening chapters of each series, complete with cliffhangers — not trailers. They let you experience the real story before deciding whether to unlock more.",
      },
      {
        question: "What is the cheapest way to keep watching?",
        answer:
          "Sample several series and use the free episodes each live title currently identifies. On VERZA TV, an occasional one-time Series Unlock may suit selective viewing; if you watch broadly, compare the VIP option shown on an available checkout surface before choosing.",
      },
    ],
  },
  {
    slug: "how-to-start-watching",
    title: "How to Start Watching Microdramas",
    blurb:
      "New to vertical drama? This step-by-step guide shows you how to start watching microdramas on VERZA TV in minutes — what to pick and how to dive in.",
    intro:
      "Getting into microdramas takes almost no setup, which is part of the appeal. There is no download queue, no lengthy onboarding, and no need to commit before you have seen anything. In a couple of minutes you can be deep in a vertical revenge saga or a billionaire romance. This guide gives you a simple, ordered path from never having watched a microdrama to comfortably bingeing your first series, with tips on choosing well so your first experience hooks you the way the format intends.",
    sections: [
      {
        heading: "Step one: open the catalog",
        body: "Start by browsing a microdrama catalog. On VERZA TV you can do this right in your browser on a phone or desktop — no app required. Scan the posters and genre tabs and notice what pulls you in: a dramatic title, a striking poster, a logline that promises a twist. Microdramas live or die on hooks, so trust your gut reaction. The catalog is organized by genre and theme, so if you already love thrillers or romance, head straight to that tab.",
      },
      {
        heading: "Step two: pick a series and start the free episodes",
        body: "Choose a series and open an available episode. The series page identifies its current free-access limit, and those episodes are part of the actual program rather than separate trailers. Watch in order to decide whether the story's pace, tone, and characters click with you before choosing paid access.",
      },
      {
        heading: "Step three: learn the controls as you go",
        body: "You do not need to study anything in advance. Swipe up for the next episode, swipe down to go back, and tap to pause or to unmute. Turn captions on if you are watching quietly. Autoplay will carry you from one episode to the next, so a binge can run almost hands-free. The interface is intentionally minimal; within a few episodes the gestures become second nature and disappear into the experience.",
      },
      {
        heading: "Step four: continue with a Series Unlock or VIP",
        body: "When an eligible series' free episodes end, supported purchase surfaces offer a $1.99 one-time Series Unlock for that title and may also show an available VIP plan. Stripe identifies the product, total, and any recurring terms before you authorize payment.",
      },
    ],
    faq: [
      {
        question: "Do I need to sign up before watching?",
        answer:
          "No. You can start the episodes marked free without an account. You need to sign in before buying a Series Unlock or VIP so access can be tied to the correct account.",
      },
      {
        question: "Which series should I start with?",
        answer:
          "Pick by genre and hook. If you love romance, thrillers, or revenge stories, head to that tab and choose a series whose poster and logline grab you. Use the episodes marked free on that title to test the fit.",
      },
      {
        question: "How long until I'm hooked?",
        answer:
          "Usually within the available free preview. Microdramas front-load their cliffhangers, so by the end of the free chapters most viewers know whether they want to keep watching a given series.",
      },
    ],
  },
  {
    slug: "microdrama-vs-traditional-tv",
    title: "Microdrama vs Traditional TV: What's the Difference?",
    blurb:
      "How do microdramas compare to traditional television? A clear look at episode length, format, pacing, cost, and viewing habits across both.",
    intro:
      "Microdramas and traditional television tell stories, but almost everything else about them differs — episode length, screen orientation, pacing, business model, and the moments in your day when you actually watch. Neither is better in the abstract; they suit different needs. This guide compares the two formats fairly so you can understand what microdramas add to the entertainment landscape and when each format is the right choice. If you grew up on hour-long TV dramas, this is the bridge to understanding the vertical format.",
    sections: [
      {
        heading: "Episode length and structure",
        body: "Traditional television generally uses longer episodes built for a dedicated sitting. Microdramas use shorter serialized chapters, but there is no universal runtime or required cliffhanger schedule. Compare the actual episode list and format of the selected titles rather than relying on a fixed duration claim.",
      },
      {
        heading: "Format and screen",
        body: "Traditional TV is shot in widescreen 16:9 for a horizontal screen — a television or a sideways phone. Microdramas are shot vertically in 9:16 for a phone held upright, filling the screen with no black bars. This is not a minor cosmetic difference: vertical framing changes how scenes are composed, favoring close-ups and faces, and it removes the friction of rotating your device. Microdramas are designed for the device most people already watch on, in the orientation they already hold it.",
      },
      {
        heading: "When and how you watch",
        body: "Traditional TV often asks for a dedicated block of time. Microdramas are designed for shorter viewing sessions and serialized continuation, though the commitment still varies with each episode and season. Viewers can use the title's real episode list to decide whether it fits the time available.",
      },
      {
        heading: "Cost and access",
        body: "Most traditional streaming runs on a flat monthly subscription for a whole library. Microdramas typically use a free-to-start model with either per-title access, virtual currency, or a membership. VERZA TV currently offers flat one-time Series Unlocks for eligible titles and may show an available VIP plan on a supported purchase surface, so viewers can compare one story's price with recurring catalog access.",
      },
    ],
    faq: [
      {
        question: "Are microdramas replacing traditional TV?",
        answer:
          "Not replacing — complementing. Microdramas fill the short gaps in a day where a 45-minute episode does not fit. Many viewers enjoy both: TV for dedicated evenings, microdramas for everything in between.",
      },
      {
        question: "Is the production quality lower than TV?",
        answer:
          "Production approach varies by title and service. Evaluate the selected program's footage, credits, format, and available episodes rather than assuming one quality level for the entire category.",
      },
      {
        question: "Which is cheaper to watch?",
        answer:
          "It depends on the service and your viewing habits. Compare each platform's disclosed free access, per-title price, virtual-currency terms if any, and recurring subscription total. VERZA TV currently uses one-time Series Unlocks and optional VIP rather than coins.",
      },
    ],
  },
  {
    slug: "history-of-vertical-drama",
    title: "The History of Vertical Drama",
    blurb:
      "From early mobile video to serialized phone-first storytelling: a short history of vertical drama and how services such as VERZA TV use the format.",
    intro:
      "Vertical drama developed alongside mobile video and short, swipeable content. Understanding that history helps explain the format's phone-first framing and serialized structure. This guide traces the broad path from early vertical-video experiments to dedicated drama services without assigning unverified worldwide output, audience, or market figures.",
    sections: [
      {
        heading: "The mobile-first shift",
        body: "For years, video was horizontal because screens were horizontal — televisions and computer monitors. As smartphones became the primary screen for most people, that assumption broke. Viewers were holding a tall, narrow screen and being served wide content that left half the display empty. The mismatch created an opening. The first platforms to embrace vertical video, designing for the phone rather than fighting it, found that audiences responded strongly to content that filled the whole screen.",
      },
      {
        heading: "Short video sets the stage",
        body: "TikTok, Instagram Reels, and YouTube Shorts trained an enormous audience to watch vertical video and to navigate it by swiping. They proved that people would happily consume scripted and unscripted content one short clip at a time. What they did not provide was serialized, season-long storytelling. That gap — vertical and short, but with the narrative depth of television — is exactly what vertical drama would fill, borrowing the swipe interface and short runtime while adding continuous plots.",
      },
      {
        heading: "The microdrama boom",
        body: "Vertical drama as a distinct format gained early prominence through Chinese studios and apps producing serialized mobile stories. The format later expanded to English-language originals and international services. Audience size, revenue, and access models differ by platform, so this guide does not assign unverified universal metrics to the category.",
      },
      {
        heading: "Where it is going",
        body: "Vertical drama is now offered across multiple markets and services. VERZA TV distributes short-form programming across romance, thriller, revenge, mystery, reality, and other categories, with current free and paid access shown by title. The format is one approach to serialized phone-first storytelling rather than a universal template.",
      },
    ],
    faq: [
      {
        question: "Where did vertical drama originate?",
        answer:
          "The format took off first through Chinese studios and apps that industrialized short serialized dramas and proved the freemium coin model at scale, before spreading to English-language originals and international platforms.",
      },
      {
        question: "Why is video shot vertically now?",
        answer:
          "Because phones are the primary screen for most viewers, and a phone held upright is tall and narrow. Vertical video fills that screen completely, removing the empty bars left by horizontal content.",
      },
      {
        question: "Is vertical drama still growing?",
        answer:
          "Yes. The format continues to expand globally with rising production values, larger catalogs, new genres, and ongoing investment from platforms producing original vertical series, including US-based services like VERZA TV.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
