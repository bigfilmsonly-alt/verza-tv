"use client";

/*
 * VERZA FOR CREATORS — the public recruitment surface (creator stage 1).
 *
 * COPY CONSTRAINT, READ BEFORE EDITING:
 * scripts/audit-perf.ts FAILS THE BUILD on earnings promises and turnaround
 * SLAs in rendered copy. Do not write a revenue split, a percentage, or a
 * review-time commitment anywhere in this file. Commercial terms are provided
 * separately to approved creators, and an earnings promise inside the iOS
 * binary is an App Store rejection risk.
 *
 * So this page converts on OWNERSHIP, CREDIBILITY and DISTRIBUTION instead of
 * on a number. Every claim below is a fact that is true today.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import CreatorBetaForm from "@/components/CreatorBetaForm";
import { foldText } from "@/lib/text-fold";

export interface CreatorChannel {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  titles: { slug: string; title: string; posterUrl: string }[];
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function Band({
  children,
  tint,
}: {
  children: React.ReactNode;
  tint?: boolean;
}) {
  return (
    <section
      className="px-5"
      style={{
        paddingTop: 34,
        paddingBottom: 34,
        background: tint ? T.surface : "transparent",
        borderTop: tint ? `1px solid ${T.line}` : "none",
        borderBottom: tint ? `1px solid ${T.line}` : "none",
      }}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2.5"
      style={{ color: T.accent }}
    >
      {children}
    </p>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-bold leading-tight mb-3"
      style={{ color: T.text, fontSize: "clamp(19px, 5.4vw, 24px)" }}
    >
      {children}
    </h2>
  );
}

function Check() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.success}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Cross() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.textMute}
      strokeWidth="3"
      strokeLinecap="round"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

export default function CreatorsLanding({
  channels = [],
  isApprovedCreator = false,
}: {
  channels?: CreatorChannel[];
  isApprovedCreator?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* Live channel shelf + CTA state. Both are best-effort: if either request
     fails the page still renders (empty showcase, "Become a creator" CTA)
     rather than breaking the recruitment surface. */
  const [liveChannels, setLiveChannels] = useState<CreatorChannel[]>(channels);
  const [approved, setApproved] = useState(isApprovedCreator);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/creator/channels")
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d?.channels)) setLiveChannels(d.channels); })
      .catch(() => {});
    fetch("/api/creator/me")
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.creator?.status === "approved") setApproved(true); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /* Folded on BOTH sides. toLowerCase() alone is case folding: a creator
     named "Jose Ramirez" was unreachable by typing "José", and "Muñoz" was
     unreachable by typing "Munoz" — the same defect that made "pasion" miss
     "Sentencia de pasión" on the catalogue search. */
  const visible = query.trim()
    ? liveChannels.filter((c) => {
        const q = foldText(query).trim();
        return (
          foldText(c.displayName).includes(q) ||
          foldText(c.handle).includes(q) ||
          c.titles.some((t) => foldText(t.title).includes(q))
        );
      })
    : liveChannels;

  const ctaHref = approved ? "/studio" : "/creator";
  const ctaLabel = approved ? "Creator dashboard" : "Become a creator";

  return (
    <div style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>
      {/* ── 1. HERO — lead with ownership ─────────────────────────── */}
      <section className="relative px-5 text-center overflow-hidden" style={{ paddingTop: 30, paddingBottom: 30 }}>
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: -70, left: "50%", transform: "translateX(-50%)",
            width: 360, height: 260,
            background: `radial-gradient(circle, rgba(224,17,95,0.20), transparent 68%)`,
          }}
        />
        <div className="relative">
          <Eyebrow>Verza for creators</Eyebrow>
          <h1
            className="font-black leading-[1.05] mb-3"
            style={{ color: T.text, fontSize: "clamp(30px, 9vw, 40px)", letterSpacing: "-0.02em" }}
          >
            Own your show.
          </h1>
          <p
            className="mx-auto leading-relaxed"
            style={{ color: T.textDim, fontSize: "clamp(14px, 3.9vw, 15px)", maxWidth: 340 }}
          >
            Every other platform rents you an audience and keeps your work.
            Verza is the opposite. You bring the show, you keep the rights, and
            you get your own channel in front of viewers who are already here.
          </p>

          <Link
            href={ctaHref}
            className="inline-block mt-6 px-8 py-3.5 rounded-full font-bold no-underline transition-transform active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`,
              color: "#fff",
              fontSize: 15,
              boxShadow: "0 8px 28px rgba(224,17,95,0.32)",
            }}
          >
            {ctaLabel}
          </Link>
          <p className="text-[11px] mt-2.5" style={{ color: T.textMute }}>
            Free to apply. No fee, ever.
          </p>
        </div>
      </section>

      {/* ── 2. PROOF STRIP ─────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-5 py-3"
        style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, background: T.surface }}
      >
        {["You keep your rights", "Vertical or horizontal", "Free to apply", "Live on the App Store"].map((f) => (
          <span key={f} className="text-[11px] font-semibold" style={{ color: T.textDim }}>
            {f}
          </span>
        ))}
      </div>

      {/* ── 3. WHY VERZA ───────────────────────────────────────────── */}
      <Band>
        <Eyebrow>Why Verza</Eyebrow>
        <Heading>Built for people who made something</Heading>
        <div className="flex flex-col gap-3 mt-4">
          {[
            ["You own your show", "You license it to us. You do not sign it away, and you can walk away with it."],
            ["Your own channel", "A real home with your name on it, not a row in someone else's algorithm."],
            ["Distribution built in", "Your titles sit alongside the rest of the catalogue, in front of an audience that is already watching."],
            ["Earn directly from your viewers", "Viewers unlock your work. No brand deal required, no sponsor to please."],
            ["Backed by real pedigree", "Verza was built by the team behind E! Entertainment Television."],
          ].map(([title, body]) => (
            <div key={title} className="flex gap-3">
              <Check />
              <div>
                <p className="text-[14px] font-bold leading-snug" style={{ color: T.text }}>{title}</p>
                <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: T.textDim }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Band>

      {/* ── 4. PEDIGREE ────────────────────────────────────────────── */}
      <Band tint>
        <div className="text-center">
          <Eyebrow>The team</Eyebrow>
          <Heading>Built by the people who built E!</Heading>
          <p className="text-[13px] leading-relaxed mx-auto" style={{ color: T.textDim, maxWidth: 350 }}>
            Verza was founded by Alan Mruvka, co-founder of E! Entertainment
            Television, a network that reached hundreds of millions of homes.
            The same instinct for what an audience actually wants to watch is
            behind this platform, pointed at a new format.
          </p>
          <div
            className="mt-5 mx-auto rounded-xl px-5 py-4"
            style={{ background: T.raised, border: `1px solid ${T.line}`, maxWidth: 350 }}
          >
            <p className="text-[13px] italic leading-relaxed" style={{ color: T.text }}>
              &ldquo;We built E! because nobody was telling those stories. Verza
              exists for the same reason.&rdquo;
            </p>
            <p className="text-[11px] mt-2 font-semibold" style={{ color: T.textMute }}>
              Alan Mruvka, Founder
            </p>
          </div>
          <Link
            href="/founder"
            className="inline-block mt-4 text-[12px] font-semibold no-underline"
            style={{ color: T.accent }}
          >
            Read the founder story
          </Link>
        </div>
      </Band>

      {/* ── 5. HOW IT WORKS ────────────────────────────────────────── */}
      <Band>
        <Eyebrow>How it works</Eyebrow>
        <Heading>Four steps</Heading>
        <div className="flex flex-col gap-3.5 mt-4">
          {[
            ["Apply", "Tell us who you are and what you have made. It takes a few minutes and you can save and come back."],
            ["Get approved", "We review every application ourselves. You will see your status the moment you log in."],
            ["Build your channel", "Set your banner, avatar and bio. Your channel goes live with your titles on it."],
            ["Earn", "Viewers unlock your work and you get paid. Commercial terms are shared with you on approval."],
          ].map(([title, body], i) => (
            <div key={title} className="flex gap-3.5">
              <div
                className="flex items-center justify-center rounded-full font-bold shrink-0"
                style={{
                  width: 26, height: 26, fontSize: 12,
                  background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`, color: "#fff",
                }}
              >
                {i + 1}
              </div>
              <div>
                <p className="text-[14px] font-bold leading-snug" style={{ color: T.text }}>{title}</p>
                <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: T.textDim }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Band>

      {/* ── 6. COMPARISON ──────────────────────────────────────────── */}
      <Band tint>
        <Eyebrow>The difference</Eyebrow>
        <Heading>Verza vs studio platforms</Heading>
        <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.line}` }}>
          <div className="grid grid-cols-[1fr_58px_58px] items-center px-3 py-2.5" style={{ background: T.raised }}>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.textMute }}>&nbsp;</span>
            <span className="text-[11px] font-bold text-center" style={{ color: T.accent }}>Verza</span>
            <span className="text-[11px] font-bold text-center" style={{ color: T.textMute }}>Studios</span>
          </div>
          {[
            ["You keep the rights", true],
            ["Your own named channel", true],
            ["Vertical and horizontal", true],
            ["Walk away with your work", true],
          ].map(([label], i) => (
            <div
              key={String(label)}
              className="grid grid-cols-[1fr_58px_58px] items-center px-3 py-3"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${T.line}` }}
            >
              <span className="text-[13px]" style={{ color: T.text }}>{label}</span>
              <span className="flex justify-center"><Check /></span>
              <span className="flex justify-center"><Cross /></span>
            </div>
          ))}
        </div>
      </Band>

      {/* ── 7. CHANNELS SHOWCASE ───────────────────────────────────── */}
      <Band>
        <Eyebrow>Creator channels</Eyebrow>
        <Heading>Who is already here</Heading>

        <div className="relative mt-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators and shows"
            aria-label="Search creator channels"
            className="w-full rounded-full px-4 py-2.5 text-[13px] outline-none"
            style={{ background: T.raised, border: `1px solid ${T.line}`, color: T.text }}
          />
        </div>

        {visible.length === 0 ? (
          <div
            className="rounded-xl px-5 py-7 text-center"
            style={{ background: T.raised, border: `1px dashed ${T.line}` }}
          >
            <p className="text-[14px] font-bold" style={{ color: T.text }}>
              {liveChannels.length === 0 ? "The first channels are being built" : "No match"}
            </p>
            <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: T.textDim }}>
              {liveChannels.length === 0
                ? "Creator channels are opening now. Apply and yours could be among the first on the platform."
                : "Try a different creator or show name."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {visible.map((c) => (
              <div key={c.handle}>
                {/* Ribbon: the channel name */}
                <Link
                  href={`/@${c.handle}`}
                  className="flex items-center gap-2.5 mb-2.5 no-underline"
                >
                  {c.avatarUrl ? (
                    <Image
                      src={c.avatarUrl}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ width: 28, height: 28, background: T.raised, color: T.textDim }}
                    >
                      {c.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[14px] font-bold" style={{ color: T.text }}>
                    {c.displayName}
                  </span>
                  <span className="text-[12px]" style={{ color: T.textMute }}>
                    @{c.handle}
                  </span>
                </Link>

                {/* Row of three posters; scrolls horizontally past three */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                  {c.titles.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/watch/${t.slug}`}
                      className="block no-underline shrink-0"
                      style={{ width: "31%", minWidth: 104 }}
                    >
                      <div
                        className="relative overflow-hidden rounded-lg"
                        style={{ aspectRatio: "2 / 3", background: T.raised }}
                      >
                        {t.posterUrl && (
                          <Image src={t.posterUrl} alt={t.title} fill sizes="33vw" className="object-cover" />
                        )}
                      </div>
                      <p
                        className="text-[11px] font-semibold mt-1.5 leading-tight line-clamp-2"
                        style={{ color: T.text }}
                      >
                        {t.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Band>

      {/* ── 8. FAQ ─────────────────────────────────────────────────── */}
      <Band tint>
        <Eyebrow>Questions</Eyebrow>
        <Heading>Before you apply</Heading>
        <div className="mt-4 flex flex-col gap-2">
          {[
            [
              "Do I keep the rights to my show?",
              "Yes. You license your work to Verza so we can stream it. You keep ownership, and the scope of that license follows the territory and exclusivity you choose in your application.",
            ],
            [
              "What can I upload?",
              "Finished vertical or horizontal titles: microdramas, short films, series, reality and music. You can share a Drive or Dropbox folder, or paste individual links from any host.",
            ],
            [
              "Does it cost anything?",
              "No. Applying is free and there is no fee to have a channel on Verza.",
            ],
            [
              "Who is behind Verza?",
              "Verza was founded by Alan Mruvka, co-founder of E! Entertainment Television. The app is live on the App Store.",
            ],
          ].map(([q, a], i) => (
            <div key={q} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.line}` }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left"
                style={{ background: T.raised }}
              >
                <span className="text-[13px] font-semibold" style={{ color: T.text }}>{q}</span>
                <span
                  className="text-[16px] leading-none shrink-0"
                  style={{ color: T.textMute, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform .18s" }}
                >
                  +
                </span>
              </button>
              {openFaq === i && (
                <p className="text-[13px] leading-relaxed px-3.5 py-3" style={{ color: T.textDim }}>
                  {a}
                </p>
              )}
            </div>
          ))}
        </div>
      </Band>

      {/* ── 9. CLOSING CTA + the existing beta intake ──────────────── */}
      <Band>
        <div className="text-center">
          <Heading>Ready to bring your show?</Heading>
          <p className="text-[13px] leading-relaxed mx-auto mb-5" style={{ color: T.textDim, maxWidth: 330 }}>
            Applications are open. Tell us what you have made and we will take it
            from there.
          </p>
          <Link
            href={ctaHref}
            className="inline-block px-8 py-3.5 rounded-full font-bold no-underline transition-transform active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${T.accent}, #8B5CF6)`,
              color: "#fff",
              fontSize: 15,
              boxShadow: "0 8px 28px rgba(224,17,95,0.32)",
            }}
          >
            {ctaLabel}
          </Link>
        </div>

        {/* The existing lightweight intake stays available below the CTA for
            people who would rather leave details than start the full flow. */}
        <div className="mt-8">
          <CreatorBetaForm />
        </div>
      </Band>
    </div>
  );
}
