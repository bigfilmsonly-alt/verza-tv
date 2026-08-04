import { BRAND, FREE_EPISODES, VIP_PLANS } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";
import { GENRE_HUBS } from "@/lib/content/genres";
import { LEARN_PAGES } from "@/lib/content/learn";
import {
  vipSubscriptionCheckoutEnabled,
  vipYearlyCheckoutEnabled,
} from "@/lib/vip-release-policy";

function availableVipOffers(): string[] {
  try {
    const offers: string[] = [];
    if (vipSubscriptionCheckoutEnabled()) {
      offers.push(
        `$${(VIP_PLANS.monthly.cents / 100).toFixed(2)}/month`,
      );
    }
    if (vipYearlyCheckoutEnabled()) {
      offers.push(`$${(VIP_PLANS.yearly.cents / 100).toFixed(2)}/year`);
    }
    return offers;
  } catch {
    return [];
  }
}

export function GET() {
  const liveCount = getLiveSeries().length;
  const vipOffers = availableVipOffers();
  const vipFact = vipOffers.length
    ? `VIP subscription currently shown on supported purchase surfaces: ${vipOffers.join(" or ")} for paid access while active`
    : "VIP subscription checkout is not currently offered; do not infer availability from historical or technical material";
  const body = `# ${BRAND.name}
> ${BRAND.tagline}

## What is ${BRAND.name}?
${BRAND.name} is a phone-first vertical entertainment platform founded by Alan Mruvka, co-founder of E! Entertainment Television. It offers short-form cinematic series in vertical 9:16 format at ${BRAND.domain}; episode lengths vary by title.

## Quick Facts
- ${liveCount} currently live series across Romance, Thriller, Drama, Reality, Comedy, Mystery, and more
- Episode format: short-form vertical (9:16); length varies by title
- Paid-access series currently include ${FREE_EPISODES} free preview episodes; wholly free titles identify their availability on the title page
- Full series unlock: $1.99 one-time Series Unlock
- ${vipFact}
- Production through Filmology Labs in Paterson, New Jersey

## What Is a Micro-Drama?
A micro-drama is a serialized story told in short-form episodes, often designed for phone-first vertical viewing. Episode lengths and story structures vary.

## How It Works
1. Browse ${liveCount} currently live series across genres
2. Check each title page for its current free-preview availability
3. Buy a $1.99 one-time Series Unlock; choose VIP only if a plan is currently shown on a supported purchase surface
4. Episodes auto-play in sequence for binge watching

## Genres
${GENRE_HUBS.filter(g => g.editorialApproved).map(g => `- ${g.name}: ${g.description.split('.')[0]}.`).join('\n')}

## Learn More
${LEARN_PAGES.filter(p => p.editorialApproved).map(p => `- ${p.title}: https://${BRAND.domain}/learn/${p.slug}`).join('\n')}

## Company Pages
- About: https://${BRAND.domain}/about
- Founder: https://${BRAND.domain}/founder
- Press: https://${BRAND.domain}/press
- Editorial Standards: https://${BRAND.domain}/editorial-standards
- Media Kit: https://${BRAND.domain}/media-kit

## Content
- Browse all series: https://${BRAND.domain}
- Individual series: https://${BRAND.domain}/series/{slug}

## Contact
- Website: https://${BRAND.domain}
- Press: press@${BRAND.domain}`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
