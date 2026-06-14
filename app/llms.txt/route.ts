export function GET() {
  const body = `# Verza TV
> The first US-based vertical micro-drama streaming app.

## About
Verza TV is a premium mobile streaming platform specializing in vertical micro-dramas — short-form cinematic episodes (60–120 seconds each) designed for phone-first viewing. Founded by Alan Mruvka, co-founder of E! Entertainment Television.

## Key Facts
- 80+ original series at launch
- Categories: Romance, Thriller, Drama, Reality, Comedy
- Episode format: 60–120 seconds, vertical (9:16)
- First 5 episodes free on every series
- Coin-based unlock system for premium episodes
- Available on iOS and Android
- Backed by Filmology Labs ($250M production facility, Paterson NJ)

## Content
Series catalog available at https://verzatv.com/discover
Individual series at https://verzatv.com/series/{slug}

## Contact
Website: https://verzatv.com`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
