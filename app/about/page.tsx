import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { organizationSchema } from "@/lib/schemas";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import { getLiveSeries } from "@/lib/catalog";

export const metadata: Metadata = {
  title: `About | ${BRAND.name}`,
  description:
    `Verza TV is the first US-based vertical micro-drama streaming platform. Founded by Alan Mruvka, co-founder of E! Entertainment Television. ${getLiveSeries().length}+ originals, powered by Filmology Labs.`,
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
            The first US-based vertical micro-drama streaming platform.
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
              micro-dramas -- short-form cinematic episodes (60 to 120
              seconds each) designed for phone-first viewing. Every story
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
              We believe the future of storytelling fits in your pocket.
              Attention spans are evolving, not shrinking. {BRAND.name}{" "}
              delivers cinema-quality drama in bite-sized episodes that
              respect your time while keeping you on the edge of your seat.
              Every scroll is a new cliffhanger.
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
              Our content is powered by Filmology Labs, a $250M
              state-of-the-art production facility in Paterson, New
              Jersey. With 21 soundstages, an LED volume wall for virtual
              production, and 250,000 square feet of production space,
              Filmology Labs gives {BRAND.name} a vertically integrated
              advantage no other micro-drama platform can match.
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
              {getLiveSeries().length}+ original series across Romance, Thriller, Drama,
              Comedy, Reality, Mystery, Sci-Fi, and Horror. The first 5
              episodes of every series are free. Unlock the rest with
              coins or subscribe to VIP for unlimited access.
            </p>
          </div>
        </div>

        {/* Key Numbers */}
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.accent }}
        >
          By the Numbers
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { number: "120M+", label: "Episode Views" },
            { number: "480K", label: "Monthly Active Users" },
            { number: "68%", label: "Completion Rate" },
            { number: "28 min", label: "Daily Watch Time" },
            { number: `${getLiveSeries().length}+`, label: "Original Series" },
            { number: "$6.5B", label: "Market Size" },
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
