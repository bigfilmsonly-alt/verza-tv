/**
 * COMPARISONS — answer-engine (AEO) comparison pages.
 * Fair, factual, VERZA-positive editorial that compares VERZA TV with
 * other microdrama apps and with traditional streaming, plus
 * explainer comparisons of how the format and its pricing work.
 */

export interface Comparison {
  slug: string;
  title: string;
  /** 150-160 char meta description */
  blurb: string;
  /** 80-150 word introduction */
  intro: string;
  sections: { heading: string; body: string }[];
  faq: { question: string; answer: string }[];
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "verza-vs-reelshort",
    title: "VERZA TV vs ReelShort: Which Microdrama App Is Right for You?",
    blurb:
      "A fair, factual comparison of VERZA TV and ReelShort — catalog, format, pricing, and free episodes — to help you choose the right microdrama platform.",
    intro:
      "VERZA TV and ReelShort both offer serialized, phone-first stories told in short episodes. ReelShort is one of the apps that helped popularize the format in English; VERZA TV is a US-based service with a growing catalog. Both let viewers sample content before paid access, but their current payment models differ: VERZA TV uses flat Series Unlocks and optional VIP access rather than selling coins. This comparison looks at catalog, format, pricing, and experience without pretending either is the only good option.",
    sections: [
      {
        heading: "The format is the same; the catalogs differ",
        body: "Both platforms offer vertical serialized programming, but episode length and format vary by title. The meaningful difference is content: the specific series, tones, and available access vary. VERZA TV's current catalog spans romance, thriller, revenge, mystery, reality, music, podcasts, and red-carpet programming. Compare the episodes each service marks free and the exact paid terms shown before checkout.",
      },
      {
        heading: "Free episodes and how you pay",
        body: "Both services use a free-to-start model. VERZA TV shows each title's free-access limit and currently offers a $1.99 one-time Series Unlock for eligible titles; a supported purchase surface may also show an available VIP plan. It does not sell coins. ReelShort uses its own free, coin, reward, and membership terms. Compare the exact current checkout total and recurring terms on each service before choosing.",
      },
      {
        heading: "Experience and access",
        body: "VERZA TV runs in your browser on phone and desktop, so you can start watching without installing anything, which lowers the friction of trying it. App-first platforms like ReelShort center the experience on a downloaded mobile app. Neither approach is universally better — browser access is convenient for quick sampling and desktop viewing, while a dedicated app can offer tighter mobile features. Your preference here often comes down to whether you want to commit a download before watching.",
      },
      {
        heading: "Who each one suits",
        body: "If you want to start instantly in a browser with a curated US-produced catalog and a transparent free-first model, VERZA TV is a strong fit. If you are already in the ReelShort ecosystem and enjoy its specific originals, there is no reason to switch blindly. The honest answer is that both are legitimate microdrama platforms, and many viewers sample several. Try the free episodes on each and let the actual stories — not the brand — make the decision for you.",
      },
    ],
    faq: [
      {
        question: "Is VERZA TV the same as ReelShort?",
        answer:
          "No. They are separate platforms with their own original catalogs. Both deliver vertical microdramas with free starting episodes, but their access models differ: VERZA TV uses flat Series Unlocks and optional VIP access, while ReelShort controls its own coin, reward, and membership terms.",
      },
      {
        question: "Do both offer free episodes?",
        answer:
          "Yes. Both use a free-to-start model. VERZA TV identifies the current free episodes for each live title, while ReelShort controls its own free-access rules.",
      },
      {
        question: "Which app is cheaper?",
        answer:
          "It depends on current coin pack and membership pricing and on how much you watch. Compare each platform's live pricing against your habits; selective viewers and heavy bingers may reach different conclusions.",
      },
    ],
  },
  {
    slug: "verza-vs-dramabox",
    title: "VERZA TV vs DramaBox: How the Two Microdrama Apps Compare",
    blurb:
      "Compare VERZA TV and DramaBox on catalog, format, free episodes, and pricing. A fair look at two vertical microdrama platforms to help you choose.",
    intro:
      "VERZA TV and DramaBox both operate in the vertical microdrama space, offering serialized short-form dramas designed for phone viewing. DramaBox is a well-known app in the category with a large library; VERZA TV is a US-based platform with a curated slate of originals and browser-first access. Both rely on a freemium model with free opening episodes and paid unlocking. This comparison weighs them fairly across the factors that actually matter — catalog, format, cost, and ease of access — so you can pick the one that matches how and where you like to watch.",
    sections: [
      {
        heading: "Catalog size versus curation",
        body: "DramaBox is known for a large catalog spanning many genres and a high volume of titles. VERZA TV takes a more curated approach across romance, thriller, revenge, mystery, reality, music, podcasts, and red-carpet programming. Bigger is not automatically better; sample the real catalogs and choose based on the available stories rather than an unsupported quality ranking.",
      },
      {
        heading: "Format and production",
        body: "Both platforms deliver the defining microdrama format: vertical 9:16 episodes of about one to two minutes, serialized into cliffhanger-driven seasons. Production values across the category have risen, with real actors, scripts, and cinematography becoming standard. Specific look and tone vary by platform and by title, so the most reliable way to judge production quality is to watch a few free episodes on each and compare directly rather than relying on catalog counts alone.",
      },
      {
        heading: "Free episodes and pricing",
        body: "Both use free-to-start models. VERZA TV identifies each title's free episodes, then offers a flat one-time Series Unlock for eligible titles or optional VIP access; it does not currently sell coins. DramaBox controls its own free, coin, reward, and membership terms. Check the exact current checkout total and recurring terms on each service.",
      },
      {
        heading: "Access and convenience",
        body: "VERZA TV runs directly in your browser on phone and desktop, letting you start without a download — handy for quick trials and big-screen viewing. DramaBox is primarily an app experience optimized for mobile. Each has its merits: browser access removes the install step, while a dedicated app can bundle mobile-specific conveniences. Your choice may simply come down to whether you would rather click a link and watch, or download an app and stay within its ecosystem.",
      },
    ],
    faq: [
      {
        question: "Does VERZA TV or DramaBox have more shows?",
        answer:
          "DramaBox is known for a large catalog, while VERZA TV offers a curated current catalog across several short-form categories. Catalogs change, so compare the live title lists rather than relying on a hard-coded count.",
      },
      {
        question: "Can I watch without downloading an app?",
        answer:
          "On VERZA TV, yes — it runs in your browser on phone and desktop, so you can start the free episodes without installing anything. DramaBox is primarily a downloaded mobile app.",
      },
      {
        question: "Do both have free episodes?",
        answer:
          "Yes. Both use a free-to-start model. VERZA TV identifies the current free episodes for each live title and uses Series Unlock or VIP access; DramaBox controls its own paid-access model.",
      },
    ],
  },
  {
    slug: "best-short-drama-apps",
    title: "Best Short Drama Apps: How to Choose the Right One",
    blurb:
      "A practical guide to the best short drama apps and how to choose — comparing catalogs, free episodes, pricing, and access across vertical microdrama platforms.",
    intro:
      "Short drama apps — also called microdrama or vertical drama platforms — have multiplied quickly, and it can be hard to know where to start. ReelShort, DramaBox, and VERZA TV are among the names you will encounter, each offering serialized vertical stories in short episodes. Rather than crown a single winner, this guide explains the factors that actually separate good short drama apps from the rest, so you can choose based on your own habits. We will then show where VERZA TV fits, honestly, among the options.",
    sections: [
      {
        heading: "What makes a short drama app good",
        body: "Three things matter most: catalog quality, fair pricing, and low friction to start. A strong app gives you enough free episodes to genuinely test a series, prices unlocks transparently, and lets you begin watching without a frustrating sign-up wall. Production values, genre range, and how reliably episodes deliver cliffhangers round out the picture. The best app for you balances these in a way that matches whether you are a casual sampler or a committed binger.",
      },
      {
        heading: "Free episodes are the real test",
        body: "Many short drama apps use a free-to-start model, so the clarity of the free tier is a fair comparison. VERZA TV identifies each live title's free episodes and has several wholly free short titles. Other apps control their own free, ad, and reward mechanics. Favor services that clearly identify what is free and show the real product and terms before payment.",
      },
      {
        heading: "Pricing models to compare",
        body: "Many short drama apps use coins, while others use per-title purchases or memberships. Compare the actual checkout total, what access persists, and whether a charge recurs. VERZA TV currently offers a $1.99 one-time Series Unlock for eligible titles; its supported purchase surface identifies any VIP plan that is presently available, together with the current price and renewal interval. It does not sell coins.",
      },
      {
        heading: "Where VERZA TV fits",
        body: "VERZA TV may fit viewers who value a curated US-based catalog, clearly identified free starting episodes, and browser or native viewing. It is not the only option; the honest recommendation is to compare the actual free episodes, available titles, and current paid terms on several services, then choose based on your own viewing habits.",
      },
    ],
    faq: [
      {
        question: "What are the most popular short drama apps?",
        answer:
          "ReelShort, DramaBox, and VERZA TV are among the available services. Their catalogs and payment models differ; VERZA TV currently uses one-time Series Unlocks and optional VIP access rather than coin purchases.",
      },
      {
        question: "How do I pick the best short drama app for me?",
        answer:
          "Compare free episodes, pricing, and ease of access against your habits. Try the free episodes on two or three apps and keep the one whose stories, production quality, and pricing fit you best.",
      },
      {
        question: "Are short drama apps free?",
        answer:
          "Many are free to start, but the details vary. VERZA TV identifies each live title's current free episodes, then may offer a one-time Series Unlock or VIP access for remaining paid episodes.",
      },
    ],
  },
  {
    slug: "are-microdramas-free-to-watch",
    title: "Are Microdramas Free to Watch? Free vs Paid Explained",
    blurb:
      "Are microdramas free? Yes, to start. A clear comparison of free episodes, coins, and memberships so you know exactly what costs money and what doesn't.",
    intro:
      "The question of whether microdramas are free deserves a straight answer with the nuance intact: you can start any series for free, and finishing the ones you love usually costs a little. Every major microdrama platform uses a freemium model, but the details — how many episodes are free, what unlocking costs, and whether a membership exists — vary. This page compares the free and paid sides of microdramas directly, so you understand precisely where the line falls and how to stay on the free side as long as possible.",
    sections: [
      {
        heading: "The free side",
        body: "On VERZA TV, each live series identifies the episodes currently available without payment, and several short titles are wholly free. Those episodes are part of the actual program rather than separate trailers. Other services control their own free, ad, and reward mechanics, so check the current product page rather than assuming every title or app has the same limit.",
      },
      {
        heading: "The paid side",
        body: "On VERZA TV, an eligible title can be continued with a $1.99 one-time Series Unlock on supported purchase surfaces, or through a VIP plan when one is currently displayed there. Browsing and sampling free episodes do not trigger a charge; Stripe shows the selected product, total, and recurring terms, if any, before payment.",
      },
      {
        heading: "Free versus paid: which to use",
        body: "If you watch occasionally, free episodes plus an occasional one-time Series Unlock may be enough. If you watch paid titles broadly, compare that total with any VIP plan shown on the supported purchase surface. Start free and move to paid only after checking the exact product and renewal terms.",
      },
      {
        heading: "How to maximize the free tier",
        body: "Sample the episodes each live title marks free and use the wholly free short titles too. The series page identifies where paid access begins, so you can compare stories before choosing a one-time unlock or recurring VIP access.",
      },
    ],
    faq: [
      {
        question: "Are microdramas completely free?",
        answer:
          "They can be free to start but are not always entirely free. VERZA TV identifies each live title's free episodes; eligible remaining episodes can require a Series Unlock or VIP access.",
      },
      {
        question: "What exactly costs money?",
        answer:
          "On VERZA TV, browsing and watching episodes marked free do not trigger a charge. Paid access is through a one-time Series Unlock for an eligible title or a recurring VIP subscription.",
      },
      {
        question: "How can I watch the most for free?",
        answer:
          "Sample several series and use the free episodes each live title currently identifies; the count can vary by title. On VERZA TV, choose an occasional one-time Series Unlock for a standout or compare the VIP option shown on an available checkout surface if you watch broadly.",
      },
    ],
  },
  {
    slug: "how-do-microdrama-coins-work",
    title: "How Do Microdrama Coins Work? Coins vs Subscriptions",
    blurb:
      "How do microdrama coins work, and are they cheaper than a subscription? A clear comparison of coin packs, per-episode unlocking, and VIP memberships.",
    intro:
      "Coins power many microdrama platforms, but they are not universal. This page explains the general coin model and compares it with subscriptions and flat per-series purchases. VERZA TV's current checkout does not sell coins; it uses one-time Series Unlocks and optional VIP access.",
    sections: [
      {
        heading: "How coins work",
        body: "Coins are a prepaid virtual currency. You buy them in bundles — smaller packs for casual viewing, larger packs for heavy bingeing — and they sit in your account until you spend them. After a series' free episodes, additional episodes cost coins; some platforms charge per episode, others let you unlock a whole series at once, usually at a discount. Larger packs include more bonus coins, lowering the effective price per coin. Because spending is tied to what you actually unlock, your cost tracks your real viewing.",
      },
      {
        heading: "How subscriptions work",
        body: "A subscription, often branded VIP, charges a recurring fee for broad access while the membership is active. VERZA TV has no coin balance; when VIP checkout is available, the supported purchase surface shows the plan, price, and renewal interval before payment. Cancellation stops future renewals while access ordinarily continues through the paid period.",
      },
      {
        heading: "Coins versus subscription: the math",
        body: "The right choice depends on volume and the service's model. On VERZA TV, compare the number of $1.99 Series Unlocks you expect to buy with the exact VIP price displayed on the supported purchase surface, if a recurring plan is available. A recurring plan is not automatically cheaper; use your real viewing estimate and review renewal terms.",
      },
      {
        heading: "Getting the most value either way",
        body: "On a coin-based service, compare the effective cost per unlock. On VERZA TV, compare one-time Series Unlocks with the exact recurring total shown for any currently available VIP plan. Choose a recurring plan only if the disclosed commitment fits your plans, and use the billing portal to stop future renewals when needed.",
      },
    ],
    faq: [
      {
        question: "What are microdrama coins?",
        answer:
          "Coins are a prepaid virtual currency you buy in packs and spend to unlock episodes beyond the free ones. Larger packs include bonus coins that lower the effective price per unlock.",
      },
      {
        question: "Are coins or a subscription cheaper?",
        answer:
          "Coins are usually cheaper if you finish only a few series a month. A subscription or VIP membership is cheaper if you binge widely across many titles, since it unlocks everything for one flat price.",
      },
      {
        question: "Can I switch between coins and VIP?",
        answer:
          "Models can change by service. VERZA TV currently lets viewers move between one-time Series Unlocks and VIP access; it does not sell coins.",
      },
    ],
  },
  {
    slug: "verza-vs-traditional-streaming",
    title: "VERZA TV vs Traditional Streaming: A Fair Comparison",
    blurb:
      "How does VERZA TV compare to Netflix-style streaming? A fair look at episode length, format, pricing, and viewing habits across microdramas and traditional streaming.",
    intro:
      "VERZA TV and traditional streaming services like the big subscription platforms both deliver scripted entertainment, but they are built for different moments and different habits. Traditional streaming offers long-form shows and films on a flat monthly subscription; VERZA TV offers vertical microdramas in short, free-to-start episodes. Neither replaces the other — they solve different problems. This comparison weighs them fairly across format, cost, and the times of day you actually watch, so you can see where each fits in a modern viewing diet rather than treating it as a contest.",
    sections: [
      {
        heading: "Episode length and commitment",
        body: "Traditional streaming often centers on long-form episodes and feature-length films that ask for a dedicated sitting. VERZA TV's microdramas use shorter serialized chapters, while reality, music, podcast, red-carpet, and other titles can run longer or use a different format. Check the selected title for its actual episode list and runtime.",
      },
      {
        heading: "Format and screen",
        body: "Traditional streaming commonly uses widescreen 16:9. Many VERZA TV microdramas use vertical 9:16 framing for a phone held upright, while some catalog categories use horizontal or other formats. The selected title and player show the format actually available.",
      },
      {
        heading: "Pricing models",
        body: "Traditional streaming usually charges a flat monthly subscription for an entire library. VERZA TV identifies free starting episodes for each live title, then offers a one-time Series Unlock for eligible titles or optional VIP access. This lets viewers compare paying for a specific story with a recurring plan.",
      },
      {
        heading: "When to use each",
        body: "Use traditional streaming for a dedicated evening: a prestige drama, a film, a show you want to give your full attention. Use VERZA TV for the in-between moments where a 45-minute episode does not fit — commutes, breaks, the last few minutes of the day. Many viewers keep both: one for immersive long-form sessions, the other for quick, bingeable vertical drama. Rather than asking which is better, ask which moment you are in; that usually answers the question.",
      },
    ],
    faq: [
      {
        question: "Is VERZA TV a replacement for Netflix-style streaming?",
        answer:
          "No — it complements it. Traditional streaming suits dedicated long-form viewing; VERZA TV fills the short gaps in a day with vertical microdramas. Many viewers use both for different moments.",
      },
      {
        question: "Is VERZA TV cheaper than a streaming subscription?",
        answer:
          "It depends on what you watch. VERZA TV identifies free episodes by title, then offers $1.99 one-time Series Unlocks or optional VIP access. Compare your expected one-time total with the recurring plan shown at checkout.",
      },
      {
        question: "Why do many VERZA TV microdramas use short episodes?",
        answer:
          "Many VERZA TV microdramas use brief serialized chapters for phone-first viewing. Episode length and story structure vary by title, and not every program is a vertical microdrama.",
      },
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
