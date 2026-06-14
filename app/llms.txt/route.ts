import { BRAND, FREE_EPISODES, DEFAULT_COIN_PER_EPISODE, VIP_WEEKLY, VIP_YEARLY } from "@/lib/config";

export function GET() {
  const body = `# ${BRAND.name}
> ${BRAND.tagline}

## What is ${BRAND.name}?
${BRAND.name} is the first US-based vertical micro-drama streaming platform. We produce and distribute premium short-form cinematic episodes (60-120 seconds each) in vertical 9:16 format, designed for phone-first viewing. Available on iOS, Android, and the web at ${BRAND.domain}.

## Founder
${BRAND.name} was founded by Alan Mruvka, co-founder of E! Entertainment Television. Alan brings decades of experience building entertainment brands from the ground up.

## Key Features
- 80+ original series at launch across Romance, Thriller, Drama, Reality, Comedy, Mystery, Sci-Fi, and Horror
- Episode format: 60-120 seconds, vertical (9:16), cinema-quality production
- First ${FREE_EPISODES} episodes of every series are free -- no account required
- Coin-based unlock system: ${DEFAULT_COIN_PER_EPISODE} coins per episode, packs from $1.99
- Season passes at ~33% off episode-by-episode pricing
- VIP subscription: $${(VIP_WEEKLY / 100).toFixed(2)}/week or $${(VIP_YEARLY / 100).toFixed(2)}/year for unlimited access
- Backed by Filmology Labs ($250M production facility, 21 soundstages, LED volume wall, Paterson NJ)

## Key Metrics
- 120M+ total episode views
- 425K average views per episode
- 68% completion rate
- 480K monthly active users
- 28 min average daily watch time

## Content
- Series catalog: https://${BRAND.domain}/discover
- Individual series: https://${BRAND.domain}/series/{slug}
- Channels: Must-sees, Trending, Drama, Reality

## Contact
- Website: https://${BRAND.domain}
- Press: press@${BRAND.domain}
- Support: support@${BRAND.domain}`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
