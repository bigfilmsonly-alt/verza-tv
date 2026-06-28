/**
 * GUIDES — long-form informational / answer-engine (AEO) content.
 * Each guide is original editorial prose about the micro-drama format,
 * how Verza TV works, and how to get the most out of vertical drama.
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
      "A microdrama is a serialized story told in 60-to-120-second vertical episodes. Learn how the format works, where it came from, and why it is exploding.",
    intro:
      "Microdramas are the fastest-growing format in entertainment, yet most people have only just started hearing the word. At its simplest, a microdrama is a scripted, serialized story told in episodes that last roughly one to two minutes each, shot vertically for a phone screen. A single season can run sixty, eighty, even a hundred episodes, but you binge them the way you scroll a feed: one cliffhanger at a time. This guide explains exactly what a microdrama is, how it differs from the short clips you already know, and why studios and viewers around the world are pouring into the format.",
    sections: [
      {
        heading: "The basic definition",
        body: "A microdrama is a professionally produced, serialized drama whose episodes run about 60 to 120 seconds. Unlike a film or a traditional TV episode, each microdrama installment delivers one tight emotional beat — a reveal, a betrayal, a kiss, a cliffhanger — and then hands you straight to the next. A full season tells a complete story, but it is engineered to be watched in short bursts on a phone. The defining traits are brevity, vertical framing, serialization, and a relentless hook-per-episode structure that keeps you tapping forward.",
      },
      {
        heading: "How microdramas differ from short clips",
        body: "TikToks, Reels, and YouTube Shorts are usually standalone moments — a joke, a dance, a tip. A microdrama is the opposite: every episode is a chapter in an ongoing narrative with recurring characters, rising stakes, and a season-long arc. The short runtime is borrowed from social video, but the storytelling is borrowed from soap operas and serialized dramas. You are not watching a clip; you are watching episode 14 of a 70-episode revenge saga, and you genuinely want to know what happens in episode 15.",
      },
      {
        heading: "Why the format works",
        body: "Microdramas fit the way people actually use phones: in fragments, between other things, with sound or without. Each episode is short enough to start on a whim and structured to make stopping hard. The vertical frame fills the whole screen, so there is no letterboxing and no need to rotate the device. And because seasons are long, a story you like can keep you engaged for hours of total runtime, delivered in pieces you can pick up and put down anywhere — a commute, a coffee line, the last few minutes before sleep.",
      },
      {
        heading: "Who makes microdramas",
        body: "The format was pioneered by Chinese studios and apps, then spread globally through platforms producing English-language originals. Verza TV is a US-based vertical micro-drama service with more than 76 original series spanning romance, thriller, revenge, mystery, and reality. Production values have climbed quickly — real actors, scripts, cinematography, and scoring — so today's microdramas look far closer to streaming television than to a phone video. The economics favor volume and serialization, which is why catalogs grow fast and new episodes arrive often.",
      },
    ],
    faq: [
      {
        question: "How long is one microdrama episode?",
        answer:
          "Most microdrama episodes run between 60 and 120 seconds. A full season typically contains dozens of episodes, so the complete story can total an hour or more of runtime delivered in short, bingeable pieces.",
      },
      {
        question: "Are microdramas the same as TikTok videos?",
        answer:
          "No. They share a vertical format and short runtime, but microdramas are scripted, serialized stories with recurring characters and season-long arcs, where social clips are usually standalone moments.",
      },
      {
        question: "Where can I watch microdramas?",
        answer:
          "You can watch microdramas on dedicated platforms like Verza TV, which streams original vertical series in your browser. The first five episodes of every Verza series are free to start.",
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
        body: "Begin by browsing a catalog and choosing a series whose poster or logline grabs you. On Verza TV, the first five episodes of every series are free, so you can sample a story before committing. Tap the poster, hit play, and the first episode begins immediately in vertical full-screen. There is no need to create an account just to start — the free episodes are open, which makes vertical drama one of the lowest-friction formats to try.",
      },
      {
        heading: "Master the swipe",
        body: "Vertical drama interfaces borrow from the social feeds you already know. Swipe up to advance to the next episode, swipe down to go back. A single tap usually pauses and resumes playback. Because episodes are so short, you will swipe often, and that is the point — the format wants you moving forward. If a series uses a horizontal player for widescreen content, you simply swipe sideways instead. The controls are intentionally minimal so nothing gets between you and the story.",
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
          "Not necessarily. Verza TV streams vertical dramas directly in your mobile or desktop browser, so you can start watching the free episodes without installing anything.",
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
      "Like any growing medium, microdramas have developed their own vocabulary — borrowed partly from television, partly from social video, and partly from gaming and app economics. If you are new to vertical drama, a few of these words can be confusing. This glossary defines the terms you will encounter most often, in plain language, so you can read about microdramas, talk about them, and navigate platforms like Verza TV without guessing. Each entry is short on purpose: a clear definition you can scan.",
    sections: [
      {
        heading: "Microdrama",
        body: "A professionally produced, serialized drama told in very short episodes, typically 60 to 120 seconds each, shot vertically for phone viewing. A season can run dozens of episodes that together tell a complete story. The term is sometimes written micro-drama or short drama, and all three refer to the same format defined by brevity, serialization, and vertical framing.",
      },
      {
        heading: "Vertical (9:16)",
        body: "Vertical refers to portrait-orientation video shaped 9:16, the native proportions of a phone held upright. Vertical content fills the entire screen with no black bars, unlike traditional 16:9 video that leaves the top and bottom of a portrait phone empty. Shooting vertically is a deliberate creative choice that frames faces and close-ups for an intimate, phone-first viewing experience.",
      },
      {
        heading: "Cliffhanger",
        body: "An unresolved, suspenseful moment placed at the end of an episode to make stopping feel impossible. Cliffhangers are the engine of the microdrama format: because episodes are so short, almost every one ends on a reveal, a threat, or an emotional gut-punch that propels you into the next. Mastering the cliffhanger is the core craft skill of microdrama writing.",
      },
      {
        heading: "Binge",
        body: "Watching many episodes back to back in a single session. Microdramas are engineered for bingeing — short episodes plus relentless cliffhangers plus autoplay make it easy to watch twenty episodes without noticing. Because each episode is brief, a binge can feel light and casual even when it covers a large chunk of a season.",
      },
      {
        heading: "Coins",
        body: "A virtual currency used on many microdrama platforms to unlock episodes beyond the free ones. You buy coins in packs and spend them per episode or per series. Coins decouple price from a fixed subscription, letting you pay only for the stories you actually want. On Verza TV the first episodes of every series are free, and coins unlock the rest.",
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
        body: "Coins suit viewers who watch selectively: you pay for the handful of series you love and nothing for the rest. A subscription suits viewers who watch broadly and want everything unlocked for one price. Many platforms, including Verza TV, offer both — coins for à la carte unlocking and a VIP membership for unlimited access. If you only finish a couple of series a month, coins are usually cheaper; if you binge constantly across many titles, a membership often wins.",
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
        body: "On Verza TV, the first five episodes of every series are free, with no payment and no commitment required to start. Across a catalog of more than 76 series, that adds up to a large amount of free, high-quality drama you can watch before spending anything. The free episodes are not trailers — they are the real opening chapters of each story, complete with the cliffhangers that make microdramas addictive. You can sample dozens of series this way and only continue with the ones that grab you.",
      },
      {
        heading: "When microdramas cost money",
        body: "After the free episodes, continuing a series costs coins, a virtual currency you buy in packs. You can also subscribe to a VIP membership for unlimited access. The key thing is that you are never charged just to look around: payment only happens when you choose to unlock more of a specific story you already like. This pay-as-you-go structure means a casual viewer can spend nothing for weeks and only pay when a particular series truly hooks them.",
      },
      {
        heading: "How to watch the most for free",
        body: "Because every series gives you five free episodes, the smartest free strategy is breadth: sample many series and ride the free chapters of each. You will quickly learn which stories are worth unlocking and which to skip. Save coins for the standout series whose cliffhangers you cannot resist. Watching the free episodes also tells you whether a series' pacing and tone suit you before you commit a single coin, which makes any spending you do far more satisfying.",
      },
      {
        heading: "Free episodes versus VIP",
        body: "If you only dip in occasionally, the free episodes plus the odd coin unlock may be all you ever need. If you find yourself bingeing constantly, a VIP membership removes the per-episode friction and unlocks everything for a flat price. Verza TV offers both a monthly and a yearly VIP plan, with the yearly option discounted for committed viewers. There is no wrong choice — start free, and upgrade only if your habits make it worthwhile.",
      },
    ],
    faq: [
      {
        question: "Can I watch microdramas without paying anything?",
        answer:
          "Yes. On Verza TV the first five episodes of every series are free, so across the full catalog you can watch a large amount of drama without spending anything or creating a payment account.",
      },
      {
        question: "Are the free episodes just previews?",
        answer:
          "No. The free episodes are the actual opening chapters of each series, complete with cliffhangers — not trailers. They let you experience the real story before deciding whether to unlock more.",
      },
      {
        question: "What is the cheapest way to keep watching?",
        answer:
          "Sample many series to use every free episode, then spend coins only on the standouts. If you binge heavily across many titles, a VIP membership becomes the cheaper option overall.",
      },
    ],
  },
  {
    slug: "how-to-start-watching",
    title: "How to Start Watching Microdramas",
    blurb:
      "New to vertical drama? This step-by-step guide shows you how to start watching microdramas on Verza TV in minutes — what to pick and how to dive in.",
    intro:
      "Getting into microdramas takes almost no setup, which is part of the appeal. There is no download queue, no lengthy onboarding, and no need to commit before you have seen anything. In a couple of minutes you can be deep in a vertical revenge saga or a billionaire romance. This guide gives you a simple, ordered path from never having watched a microdrama to comfortably bingeing your first series, with tips on choosing well so your first experience hooks you the way the format intends.",
    sections: [
      {
        heading: "Step one: open the catalog",
        body: "Start by browsing a microdrama catalog. On Verza TV you can do this right in your browser on a phone or desktop — no app required. Scan the posters and genre tabs and notice what pulls you in: a dramatic title, a striking poster, a logline that promises a twist. Microdramas live or die on hooks, so trust your gut reaction. The catalog is organized by genre and theme, so if you already love thrillers or romance, head straight to that tab.",
      },
      {
        heading: "Step two: pick a series and start the free episodes",
        body: "Choose a series and hit play. The first five episodes of every Verza TV series are free, so there is zero risk in starting. Watch them in order — they are the genuine opening of the story, not a teaser. By the end of those five episodes you will know whether the series' pace, tone, and characters click with you. If they do, you will likely be at a cliffhanger that makes the decision to continue feel obvious.",
      },
      {
        heading: "Step three: learn the controls as you go",
        body: "You do not need to study anything in advance. Swipe up for the next episode, swipe down to go back, and tap to pause or to unmute. Turn captions on if you are watching quietly. Autoplay will carry you from one episode to the next, so a binge can run almost hands-free. The interface is intentionally minimal; within a few episodes the gestures become second nature and disappear into the experience.",
      },
      {
        heading: "Step four: continue with coins or VIP",
        body: "When the free episodes end on a cliffhanger and you want more, you have two paths. Buy coins to unlock that specific series — the simplest choice for casual viewers. Or, if you can already tell you will be bingeing a lot, take a VIP membership for unlimited access across the catalog. Either way, you only pay once you are genuinely invested, which is exactly how the free-first model is meant to work.",
      },
    ],
    faq: [
      {
        question: "Do I need to sign up before watching?",
        answer:
          "No. You can start the free episodes of any Verza TV series directly in your browser without an account. You only need to sign in when you want to unlock more episodes with coins or VIP.",
      },
      {
        question: "Which series should I start with?",
        answer:
          "Pick by genre and hook. If you love romance, thrillers, or revenge stories, head to that tab and choose a series whose poster and logline grab you. Use the five free episodes to test the fit.",
      },
      {
        question: "How long until I'm hooked?",
        answer:
          "Usually within the five free episodes. Microdramas front-load their cliffhangers, so by the end of the free chapters most viewers know whether they want to keep watching a given series.",
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
        body: "A traditional TV episode runs 22 to 60 minutes and is built to fill a sitting. A microdrama episode runs 60 to 120 seconds and is built to deliver a single beat and a cliffhanger. Traditional shows pace their reveals across a long episode; microdramas pace them across an entire season of tiny episodes, hitting a hook roughly every minute. The total runtime of a microdrama season can rival a TV season, but it arrives in dozens of bite-sized pieces rather than a handful of long ones.",
      },
      {
        heading: "Format and screen",
        body: "Traditional TV is shot in widescreen 16:9 for a horizontal screen — a television or a sideways phone. Microdramas are shot vertically in 9:16 for a phone held upright, filling the screen with no black bars. This is not a minor cosmetic difference: vertical framing changes how scenes are composed, favoring close-ups and faces, and it removes the friction of rotating your device. Microdramas are designed for the device most people already watch on, in the orientation they already hold it.",
      },
      {
        heading: "When and how you watch",
        body: "Traditional TV usually asks for a dedicated block of time — an evening on the couch, a weekend binge. Microdramas slot into the gaps: a commute, a queue, a few minutes before bed. Because episodes are so short, starting one feels low-stakes, and stopping is easy in theory but hard in practice thanks to cliffhangers. The result is a viewing pattern closer to checking a feed than sitting down for a show, which is precisely why microdramas reach people who feel they have no time for TV.",
      },
      {
        heading: "Cost and access",
        body: "Most traditional streaming runs on a flat monthly subscription for a whole library. Microdramas typically use a free-to-start model: opening episodes are free, then coins or a membership unlock the rest. This lets you pay per story instead of per month, which suits selective viewers. Platforms like Verza TV offer both coins and a VIP membership, so you can choose à la carte unlocking or all-you-can-watch — flexibility that traditional TV's single-subscription model rarely provides.",
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
          "Production values have risen sharply. Today's microdramas use real actors, scripts, cinematography, and scoring. The format is shorter and vertical, but the craft increasingly resembles streaming television rather than amateur video.",
      },
      {
        question: "Which is cheaper to watch?",
        answer:
          "It depends on habits. Microdramas can be cheaper for selective viewers thanks to free episodes and pay-per-series coins. Broad bingers may prefer a flat subscription, which both microdrama VIP plans and traditional streaming offer.",
      },
    ],
  },
  {
    slug: "history-of-vertical-drama",
    title: "The History of Vertical Drama",
    blurb:
      "From early mobile video to a global phenomenon: a short history of vertical drama, how it grew, and how platforms like Verza TV carry it forward.",
    intro:
      "Vertical drama feels brand new, but it is the product of a decade of shifting habits in how people watch video. The format sits at the intersection of two trends: the move of all video consumption onto phones, and the rise of short, swipeable content. Understanding where vertical drama came from explains why it looks the way it does and why it grew so fast. This guide traces the format's path from early experiments to a worldwide industry producing thousands of episodes a year.",
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
        body: "Vertical drama as a distinct format took off first through Chinese studios and apps, which industrialized production of short serialized dramas and proved the freemium coin model at massive scale. Hit titles drew tens of millions of viewers and substantial revenue, attracting investment and rapid catalog growth. Success at home led to English-language originals and international platforms, and the format spread to Western audiences who recognized the same addictive cliffhanger-driven structure in their own language and settings.",
      },
      {
        heading: "Where it is going",
        body: "Vertical drama is now a global industry with rising production values, growing catalogs, and serious investment. US-based platforms like Verza TV produce original vertical series across romance, thriller, revenge, mystery, and reality, with free opening episodes and coin or VIP unlocking. The trajectory points toward more genres, higher craft, and deeper integration with how people already use their phones. What began as a workaround for the wrong-shaped screen has become a storytelling form in its own right.",
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
          "Yes. The format continues to expand globally with rising production values, larger catalogs, new genres, and ongoing investment from platforms producing original vertical series, including US-based services like Verza TV.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
