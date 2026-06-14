import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
