import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { BRAND_VOICE, TYPOGRAPHY_NOTES } from "@/lib/data/company";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://verzatv.com";

export const metadata: Metadata = {
  title: `Brand Assets | ${BRAND.name}`,
  description:
    "Verza TV brand and press assets: logo usage, color palette, typography, and voice guidelines for media, partners, and creators.",
  alternates: { canonical: "/brand-assets" },
  openGraph: {
    title: `Brand Assets | ${BRAND.name}`,
    description:
      "Logo usage, color palette, typography, and voice guidelines for Verza TV.",
    url: `${BASE_URL}/brand-assets`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Brand Assets | ${BRAND.name}`,
    description:
      "Logo usage, color palette, typography, and voice guidelines for Verza TV.",
  },
};

const PALETTE: { name: string; hex: string; usage: string }[] = [
  { name: "Accent / Ruby", hex: T.accent, usage: "Primary brand accent, calls to action, links" },
  { name: "Background", hex: T.bg, usage: "App and page background, deepest layer" },
  { name: "Surface", hex: T.surface, usage: "Cards, panels, and raised content" },
  { name: "Raised", hex: T.raised, usage: "Elevated surfaces and hover states" },
  { name: "Text", hex: T.text, usage: "Primary text on dark surfaces" },
  { name: "Text Dim", hex: T.textDim, usage: "Body and secondary copy" },
  { name: "Gold", hex: T.gold, usage: "Premium highlights and VIP accents" },
  { name: "Coin", hex: T.coin, usage: "Coins, pricing, and monetization cues" },
  { name: "Live", hex: T.live, usage: "Live indicators and urgent states" },
  { name: "Success", hex: T.success, usage: "Confirmations and positive states" },
];

const ASSET_CARDS: { title: string; detail: string }[] = [
  {
    title: "Primary logo",
    detail: "The Verza TV wordmark on dark backgrounds. Maintain clear space equal to the cap height of the wordmark on all sides; never crowd it.",
  },
  {
    title: "Logo on light",
    detail: "A high-contrast variant for light backgrounds and print. Use only the approved variant — do not recolor the wordmark.",
  },
  {
    title: "App icon",
    detail: "The standalone mark for app stores, favicons, and avatars. Keep it on the brand accent or background; do not place it on busy imagery.",
  },
  {
    title: "Social avatar",
    detail: "Square, centered mark sized for social profiles. Maintain padding so the mark is not cropped by circular masks.",
  },
];

const DONTS: string[] = [
  "Do not stretch, skew, or rotate the logo.",
  "Do not recolor the wordmark outside the approved palette.",
  "Do not add drop shadows, gradients, or outlines to the mark.",
  "Do not place the logo on low-contrast or busy backgrounds.",
  "Do not recreate or substitute the wordmark with another typeface.",
];

export default function BrandAssetsPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          breadcrumbSchema([
            { name: "Company", url: `${BASE_URL}/company` },
            { name: "Brand Assets", url: `${BASE_URL}/brand-assets` },
          ]),
        ]}
      />

      <section className="px-4 pt-6 pb-8">
        <Link
          href="/company"
          className="text-xs no-underline"
          style={{ color: T.textMute }}
        >
          ‹ Company
        </Link>

        <h1 className="text-2xl font-bold mt-2 mb-2" style={{ color: T.text }}>
          Brand Assets
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: T.textDim }}>
          Guidelines and assets for representing {BRAND.name} in press, on
          partner surfaces, and across creator content. Following these keeps
          the brand consistent and instantly recognizable. For packaged
          downloads and additional resources, see the{" "}
          <Link href="/media-kit" className="no-underline" style={{ color: T.accent }}>
            media kit
          </Link>
          .
        </p>

        {/* Logo assets */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Logo & Marks
        </h2>
        <div className="grid grid-cols-1 gap-3 mb-8">
          {ASSET_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-xl p-4 flex items-start justify-between gap-3"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <div>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: T.text }}
                >
                  {card.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
                  {card.detail}
                </p>
              </div>
              <span
                className="text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg flex-shrink-0"
                style={{
                  background: `${T.accent}1A`,
                  color: T.accent,
                  border: `1px solid ${T.accent}33`,
                }}
              >
                SVG · PNG
              </span>
            </div>
          ))}
        </div>

        {/* Color palette */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Color Palette
        </h2>
        <div
          className="rounded-xl overflow-hidden mb-8"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          {PALETTE.map((color, i) => (
            <div
              key={color.name}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                borderBottom:
                  i < PALETTE.length - 1 ? `1px solid ${T.line}` : "none",
              }}
            >
              <span
                className="flex-shrink-0 rounded-md"
                aria-hidden
                style={{
                  width: 28,
                  height: 28,
                  background: color.hex,
                  border: `1px solid ${T.line}`,
                }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: T.text }}
                  >
                    {color.name}
                  </span>
                  <span
                    className="text-xs font-mono uppercase"
                    style={{ color: T.textMute }}
                  >
                    {color.hex}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: T.textDim }}>
                  {color.usage}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Typography */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Typography
        </h2>
        <div className="flex flex-col gap-3 mb-8">
          {TYPOGRAPHY_NOTES.map((t) => (
            <div
              key={t.name}
              className="rounded-xl p-4"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <p className="text-sm font-semibold" style={{ color: T.text }}>
                {t.name}
              </p>
              <p className="text-xs mb-1.5" style={{ color: T.accent }}>
                {t.role}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
                {t.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Voice */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Voice & Tone
        </h2>
        <div className="flex flex-col gap-3 mb-8">
          {BRAND_VOICE.map((v) => (
            <div
              key={v.title}
              className="rounded-xl p-4"
              style={{ background: T.surface, border: `1px solid ${T.line}` }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: T.text }}>
                {v.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: T.textDim }}>
                {v.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Don'ts */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Usage Don&apos;ts
        </h2>
        <div
          className="rounded-xl p-4 mb-8"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <ul className="flex flex-col gap-2">
            {DONTS.map((d) => (
              <li
                key={d}
                className="flex items-start gap-2 text-sm"
                style={{ color: T.textDim }}
              >
                <span
                  aria-hidden
                  className="mt-1.5 flex-shrink-0 rounded-full"
                  style={{ width: 5, height: 5, background: T.live }}
                />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}
        >
          <p className="text-sm" style={{ color: T.textDim }}>
            Need an asset that isn&apos;t here?
          </p>
          <p className="text-sm font-medium mt-1" style={{ color: T.text }}>
            press@verzatv.com
          </p>
        </div>
      </section>
    </>
  );
}
