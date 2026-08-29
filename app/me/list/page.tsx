import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { getUser } from "@/lib/auth";
import { SavedShowsList, RecentlyWatchedList } from "@/components/AccountLists";

export const metadata: Metadata = {
  title: "My List",
  description: "Your saved shows and watchlist on VERZA TV.",
};

/* ------------------------------------------------------------------ */
/*  BUG THIS FIXES: both tabs of this page rendered a hard-coded empty  */
/*  state. There was no fetch, no storage read and no props — the two    */
/*  <EmptyState> calls were literals in the JSX. It told every viewer,   */
/*  forever, "No saved shows yet — tap the bookmark icon on any show to  */
/*  add it here", including the viewer who had just done exactly that.   */
/*  The bookmark was real; this page simply never looked.                */
/*                                                                      */
/*  The URL, the tab parameter and the layout are unchanged. The two     */
/*  literals are now the two list components, which read the account     */
/*  first and this device second — so the page works signed out, which   */
/*  is the state the free preview leaves people in.                      */
/* ------------------------------------------------------------------ */

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
/*  Page (server component)                                           */
/* ------------------------------------------------------------------ */
export default async function MyListPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const activeTab: TabId = searchParams.tab === "recent" ? "recent" : "saved";
  // Only a guest needs the sync prompt. It used to render for everyone,
  // including a signed-in viewer whose list was already syncing.
  const user = await getUser();

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
      <div className="px-4 pt-2 pb-4">
        {activeTab === "saved" ? <SavedShowsList /> : <RecentlyWatchedList />}
      </div>

      {/* ---- Guest sync prompt ---- */}
      {!user && (
        <div
          className="mx-4 rounded-xl p-4 flex items-center gap-3"
          style={{
            background: `${T.accent}0A`,
            border: `1px solid ${T.accent}22`,
          }}
        >
          <span style={{ color: T.accent }}>{Icons.lock}</span>
          <p className="text-xs leading-relaxed flex-1" style={{ color: T.textDim }}>
            This list is saved on this device.{" "}
            <Link
              href="/sign-in?next=%2Fme%2Flist"
              className="font-semibold no-underline"
              style={{ color: T.accent }}
            >
              Sign in
            </Link>{" "}
            and it moves to your account, so it follows you to every device.
          </p>
        </div>
      )}
    </section>
  );
}
