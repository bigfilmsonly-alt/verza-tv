import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    // Poster grids are the app's single biggest memory cost on a phone: a
    // decoded bitmap costs width*height*4 bytes in RAM no matter how small the
    // file is. Next's DEFAULT breakpoints jump 384 -> 640, and a 33vw tile on a
    // DPR-3 iPhone needs ~390-436 device px, so every tile rounded UP to the
    // 640w candidate. The 448/512 entries land just above that requirement so
    // tiles pick a correctly-sized candidate instead. 2048/3840 are dropped:
    // poster sources are <=1080px wide and the optimizer never enlarges.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 448, 512],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://translate.google.com https://player.vimeo.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://*.googleadservices.com https://adservice.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://*.mux.com https://www.google-analytics.com https://translate.google.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net wss://*.supabase.co",
              "frame-src 'self' https://js.stripe.com https://player.vimeo.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com",
              "media-src 'self' https://*.mux.com blob:",
              // hls.js runs its transmuxer in a blob worker; without this the
              // worker is CSP-blocked and playback falls back to the slower
              // inline path (or stalls on some browsers).
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com",
            ].join("; "),
          },
        ],
      },
      {
        source: "/posters/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/shop/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Prevent search engines from indexing preview/development deploys
      ...(process.env.VERCEL_ENV !== "production"
        ? [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Robots-Tag", value: "noindex, nofollow" },
              ],
            },
          ]
        : []),
    ];
  },

  async redirects() {
    return [
      // Normalize trailing slashes
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true,
      },
      // Typo slug redirects
      { source: "/series/the-chauffer", destination: "/series/the-chauffeur", permanent: true },
      { source: "/series/the-pendelton-secrete", destination: "/series/the-pendleton-secret", permanent: true },
    ];
  },
};

export default nextConfig;
