export function GET() {
  const isProduction =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "production";

  const body = isProduction
    ? `
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://verzatv.com/sitemap.xml
`
    : `
User-agent: *
Disallow: /
`;

  return new Response(body.trim(), {
    headers: { "Content-Type": "text/plain" },
  });
}
