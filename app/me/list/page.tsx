import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `My List | ${BRAND.name}`,
  description: "Your saved shows and watchlist on Verza TV.",
};

/* ------------------------------------------------------------------ */
/*  SVG icons                                                         */
/* ------------------------------------------------------------------ */
const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icons = {
  arrowLeft: (
    <svg {...iconProps}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  bookmark: (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  ),
  clock: (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  lock: (
    <svg {...iconProps} width="16" height="16">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Tab types                                                         */
/* ------------------------------------------------------------------ */
type TabId = "saved" | "recent";

const tabs: { id: TabId; label: string }[] = [
  { id: "saved", label: "Saved Shows" },
  { id: "recent", label: "Recently Watched" },
];

/* ------------------------------------------------------------------ */
/*  Empty-state component                                             */
/* ------------------------------------------------------------------ */
function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: `${T.accent}12` }}
      >
        <span style={{ color: T.accent }}>{icon}</span>
      </div>
      <p className="text-base font-semibold mb-1.5" style={{ color: T.text }}>
        {title}
      </p>
      <p
        className="text-sm text-center max-w-[260px] mb-6 leading-relaxed"
        style={{ color: T.textMute }}
      >
        {message}
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-lg text-sm font-semibold no-underline transition-opacity hover:opacity-90"
        style={{ background: T.accent, color: "#fff" }}
      >
        Browse Shows
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (server component)                                           */
/* ------------------------------------------------------------------ */
export default async function MyListPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const activeTab: TabId =
    searchParams.tab === "recent" ? "recent" : "saved";

  return (
    <section className="max-w-lg mx-auto pb-10">
      {/* ---- Top bar ---- */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <Link
          href="/me"
          className="flex items-center justify-center w-9 h-9 rounded-full no-underline transition-colors"
          style={{ color: T.text, background: `${T.text}0A` }}
          aria-label="Back to profile"
        >
          {Icons.arrowLeft}
        </Link>
        <h1 className="text-lg font-bold" style={{ color: T.text }}>
          My List
        </h1>
      </div>

      {/* ---- Tab bar ---- */}
      <div
        className="flex mx-4 rounded-lg overflow-hidden mb-2"
        style={{
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={`/me/list${tab.id === "saved" ? "" : "?tab=recent"}`}
              className="flex-1 text-center py-2.5 text-sm font-semibold no-underline transition-colors"
              style={{
                color: isActive ? "#fff" : T.textMute,
                background: isActive ? T.accent : "transparent",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* ---- Tab content ---- */}
      {activeTab === "saved" ? (
        <EmptyState
          icon={Icons.bookmark}
          title="No saved shows yet"
          message="Tap the bookmark icon on any show to add it here for easy access."
        />
      ) : (
        <EmptyState
          icon={Icons.clock}
          title="Nothing watched yet"
          message="Shows you start watching will appear here so you can pick up where you left off."
        />
      )}

      {/* ---- Guest sync prompt ---- */}
      <div
        className="mx-4 rounded-xl p-4 flex items-center gap-3"
        style={{
          background: `${T.accent}0A`,
          border: `1px solid ${T.accent}22`,
        }}
      >
        <span style={{ color: T.accent }}>{Icons.lock}</span>
        <p className="text-xs leading-relaxed flex-1" style={{ color: T.textDim }}>
          <Link
            href="/sign-in"
            className="font-semibold no-underline"
            style={{ color: T.accent }}
          >
            Sign in
          </Link>{" "}
          to sync your list across devices.
        </p>
      </div>
    </section>
  );
}
