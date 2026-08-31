import Link from "next/link";
import { T } from "@/lib/theme";

/**
 * The one empty state.
 *
 * Testers singled out the Anime tab's "coming soon" card as the model for the
 * whole app — a clock, one honest sentence, and a button that goes somewhere
 * useful — and the instruction for this sprint was to copy that exact pattern
 * rather than design a second one. This component IS that pattern, lifted
 * verbatim from `components/BrowsePage.tsx` (the Anime placeholder) so that
 * every surface saying "nothing here yet" says it in one voice.
 *
 * The three constants below are the card. Do not re-tune them per surface:
 *   background  rgba(12,12,20,0.82)      — the neutral slate of the "Coming
 *                                          Soon" badge, deliberately NOT brand
 *                                          pink/violet, because those invite a
 *                                          tap and this card does not.
 *   border      1px rgba(255,255,255,0.28)
 *   glyph       a 44px circle holding a clock
 *
 * Deliberately NOT a "use client" module: rendered from a client component it
 * is bundled as client code and may take an `onClick` action; rendered from a
 * server component (a show page) it stays on the server and takes an `href`.
 * Adding "use client" here would break the server case for no gain.
 */

export type EmptyStateAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

export default function EmptyState({
  title,
  body,
  action,
  className = "",
  constrain = true,
  glyph,
}: {
  /** One short line. What is not here. */
  title: string;
  /** One honest sentence. Why, and what the viewer can do instead. */
  body: React.ReactNode;
  /** The escape hatch. A dead end with no way out is the thing this replaces. */
  action?: EmptyStateAction | null;
  /** Outer spacing, owned by the caller — surfaces sit in different rhythms. */
  className?: string;
  /** max-w-sm on a full-bleed tab; off inside an already-narrow page column. */
  constrain?: boolean;
  /** Override only for a genuinely different reason for emptiness. */
  glyph?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div
        className={`w-full mx-auto rounded-2xl px-6 py-10 text-center ${constrain ? "max-w-sm" : ""}`}
        style={{
          background: "rgba(12,12,20,0.82)",
          border: "1px solid rgba(255,255,255,0.28)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}
        >
          {glyph ?? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F5F4F8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </div>
        <p className="text-base font-bold mb-1.5" style={{ color: T.text }}>
          {title}
        </p>
        <p className="text-xs leading-relaxed m-0" style={{ color: "#8A8A9A" }}>
          {body}
        </p>
        {action ? (
          action.href ? (
            <Link
              href={action.href}
              className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-bold no-underline transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)", color: "#fff" }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-bold cursor-pointer border-0 transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)", color: "#fff" }}
            >
              {action.label}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
