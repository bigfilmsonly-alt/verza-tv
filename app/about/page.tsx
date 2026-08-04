import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "About",
  description:
    `VERZA TV is a phone-first short-form entertainment platform founded by Alan Mruvka, co-founder of E! Entertainment Television. Its current catalog contains ${getLiveSeries().length} live series.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />

      <section className="px-4 pt-6 pb-8">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: T.text }}
        >
          About {BRAND.name}
        </h1>

        {/* Hero statement */}
        <div
          className="rounded-xl p-5 mb-8"
          style={{
            background: `linear-gradient(135deg, ${T.accent}11, ${T.accent}22)`,
            border: `1px solid ${T.accent}33`,
          }}
        >
          <p
            className="text-lg font-semibold leading-relaxed"
            style={{ color: T.text }}
          >
            A phone-first platform for short-form vertical entertainment.
          </p>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: T.textDim }}
          >
            {BRAND.tagline}
          </p>
        </div>

        {/* Story sections */}
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              Our Mission
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: T.textDim }}
            >
              {BRAND.name} is redefining entertainment for the mobile-first
              generation. We produce and distribute premium vertical
              micro-dramas -- short-form cinematic episodes designed for
              phone-first viewing, with length varying by title. Every story
              is crafted to hook you from the first swipe.
            </p>
          </div>

          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              Founded By
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: T.textDim }}
            >
              {BRAND.name} was founded by Alan Mruvka, co-founder of E!
              Entertainment Television. With decades of experience building
              entertainment brands from the ground up, Alan brings a proven
              track record to the vertical micro-drama revolution.
            </p>
          </div>

          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              The Vision
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: T.textDim }}
            >
              We believe short-form storytelling should fit naturally into
              the time viewers have. {BRAND.name} delivers stories and other
              programming in episodes designed for quick viewing across
              supported devices.
            </p>
          </div>

          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              Filmology Labs
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: T.textDim }}
            >
              Available content is produced by or licensed to {BRAND.name}.
              Production partners, facilities, format, and availability vary
              by title.
            </p>
          </div>

          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: T.accent }}
            >
              Content
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: T.textDim }}
            >
              {getLiveSeries().length} live series across Drama, Reality,
              Music, Podcasts, Red Carpet, and more. Each title identifies its
              current free episodes. Eligible titles offer a one-time Series
              Unlock or optional VIP access on supported purchase surfaces.
            </p>
          </div>
        </div>

        {/* Platform Facts */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          Platform
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { number: `${getLiveSeries().length}+`, label: "Original Series" },
            { number: "9:16", label: "Vertical Format" },
            { number: "Varies", label: "Episode Length" },
            { number: "Web + Apps", label: "Supported Platforms" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4 text-center"
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
              }}
            >
              <p
                className="text-xl font-bold"
                style={{ color: T.text }}
              >
                {stat.number}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: T.textMute }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Platform */}
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: T.surface,
            border: `1px solid ${T.line}`,
          }}
        >
          <p className="text-sm" style={{ color: T.textDim }}>
            Available on iOS, Android, and Web.
          </p>
          <p
            className="text-sm font-medium mt-1"
            style={{ color: T.text }}
          >
            {BRAND.domain}
          </p>
        </div>
      </section>
    </>
  );
}
