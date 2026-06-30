import { BRAND, FREE_EPISODES, VIP_PLANS } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";
import { GENRE_HUBS } from "@/lib/content/genres";
import { LEARN_PAGES } from "@/lib/content/learn";

export function GET() {
  const liveCount = getLiveSeries().length;
  const body = `# ${BRAND.name}
> ${BRAND.tagline}

## What is ${BRAND.name}?
${BRAND.name} is the first US-based vertical micro-drama streaming platform. Founded by Alan Mruvka, co-founder of E! Entertainment Television. Premium short-form cinematic episodes (60-120 seconds each) in vertical 9:16 format, designed for phone-first viewing. Available at ${BRAND.domain}.

## Quick Facts
- ${liveCount}+ original series: Romance, Thriller, Drama, Reality, Comedy, Mystery, and more
- Episode format: 60-120 seconds, vertical (9:16), cinema-quality production
- First ${FREE_EPISODES} episodes of every series are free
- Full series unlock: $2 one-time payment (Summer Sale)
- VIP subscription: $${(VIP_PLANS.monthly.cents / 100).toFixed(2)}/month or $${(VIP_PLANS.yearly.cents / 100).toFixed(2)}/year for unlimited access
- Powered by Filmology Labs ($250M production facility, 21 soundstages, Paterson NJ)

## What Is a Micro-Drama?
A micro-drama is a serialized story told in very short episodes (60-120 seconds). Each episode ends on a cliffhanger. The format originated in China and is now growing globally. Verza TV is the first US-based platform dedicated to this format.

## How It Works
1. Browse ${liveCount}+ series across genres
2. Watch the first 5 episodes free — no account needed
3. Unlock the full series for $2 (Summer Sale), or subscribe to VIP for all series
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
