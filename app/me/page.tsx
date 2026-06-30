import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/lib/theme";
import { BRAND } from "@/lib/config";
import LanguagePicker from "@/components/LanguagePicker";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import VipCard from "@/components/VipCard";
import { SavedCount, WatchingCount, DarkModeToggle, SignOutButton } from "@/components/ProfileDynamic";

export const metadata: Metadata = {
  title: `My Account | ${BRAND.name}`,
  description:
    "Manage your Verza TV account, coin balance, library, and settings.",
};

/* ------------------------------------------------------------------ */
/*  SVG icon helpers (Lucide-style, 20x20)                            */
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
  user: (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  bookmark: (
    <svg {...iconProps}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  ),
  play: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
  receipt: (
    <svg {...iconProps}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  globe: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  bell: (
    <svg {...iconProps}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  moon: (
    <svg {...iconProps}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  helpCircle: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  messageSend: (
    <svg {...iconProps}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  alertTriangle: (
    <svg {...iconProps}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  fileText: (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  shield: (
    <svg {...iconProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  refreshCw: (
    <svg {...iconProps}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  chevron: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  logOut: (
    <svg {...iconProps}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Shared row component                                              */
/* ------------------------------------------------------------------ */
function MenuRow({
  icon,
  label,
  detail,
  href,
  external,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: React.ReactNode;
  href: string;
  external?: boolean;
  last?: boolean;
}) {
  const inner = (
    <>
      <span style={{ color: T.textMute }}>{icon}</span>
      <span className="text-sm font-medium flex-1">{label}</span>
      {detail && (
        <span className="text-xs" style={{ color: T.textMute }}>
          {detail}
        </span>
      )}
      <span style={{ color: T.textMute }}>{Icons.chevron}</span>
    </>
  );

  const cls =
    "flex items-center gap-3 px-4 py-3.5 no-underline transition-colors";
  const style = {
    color: T.text,
    borderBottom: last ? "none" : `1px solid ${T.line}`,
  };

  if (external) {
    return (
      <a href={href} className={cls} style={style}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} style={style}>
      {inner}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                    */
/* ------------------------------------------------------------------ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-widest px-1 mb-2 mt-7"
      style={{ color: T.textMute }}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Section card                                                      */
/* ------------------------------------------------------------------ */
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: T.surface,
        border: `1px solid ${T.line}`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function MePage() {
  return (
    <section className="px-4 pt-6 pb-10 max-w-lg mx-auto">
      {/* ---- Guest header ---- */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${T.accent}18` }}
        >
          <span style={{ color: T.accent }}>{Icons.user}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold" style={{ color: T.text }}>
            Guest
          </h1>
          <p className="text-sm mt-0.5" style={{ color: T.textDim }}>
            Sign in to sync your library and purchases
          </p>
        </div>
        <Link
          href="/sign-in"
          className="px-5 py-2 rounded-lg text-sm font-semibold no-underline whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ background: T.accent, color: "#fff" }}
        >
          Sign In
        </Link>
      </div>

      {/* ---- Browse shows CTA ---- */}
      <Link
        href="/"
        className="flex items-center justify-between rounded-xl p-4 mb-2 no-underline"
        style={{
          background: `linear-gradient(135deg, ${T.accent}11, ${T.accent}22)`,
          border: `1px solid ${T.accent}33`,
        }}
      >
        <div>
          <p className="text-sm font-bold" style={{ color: T.text }}>
            Start Watching
          </p>
          <p className="text-xs mt-0.5" style={{ color: T.textDim }}>
            First 5 episodes free &middot; $2 per movie
          </p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>

      {/* ---- Creator Program ---- */}
      <SectionLabel>Creator</SectionLabel>
      <Link
        href="/studio"
        className="flex items-center gap-4 rounded-xl p-4 mb-2 no-underline"
        style={{
          background: "linear-gradient(135deg, rgba(224,17,95,0.12), rgba(139,92,246,0.12))",
          border: "1px solid rgba(224,17,95,0.25)",
        }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: T.text }}>Apply to Become a Creator</p>
          <p className="text-xs mt-0.5" style={{ color: T.textDim }}>
            Exclusive VIP — earn directly from subscribers
          </p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>

      {/* ---- VIP Subscription ---- */}
      <SectionLabel>Subscription</SectionLabel>
      <VipCard />

      {/* ---- Library ---- */}
      <SectionLabel>Library</SectionLabel>
      <SectionCard>
        <MenuRow
          icon={Icons.bookmark}
          label="My List"
          detail={<SavedCount />}
          href="/library"
        />
        <MenuRow
          icon={Icons.play}
          label="Continue Watching"
          detail={<WatchingCount />}
          href="/"
        />
        <MenuRow
          icon={Icons.receipt}
          label="Purchase History"
          detail="No purchases"
          href="/me"
          last
        />
      </SectionCard>

      {/* ---- Settings ---- */}
      <SectionLabel>Settings</SectionLabel>
      <SectionCard>
        <LanguagePicker />
        <PushNotificationToggle />
        <DarkModeToggle />
      </SectionCard>

      {/* ---- Support ---- */}
      <SectionLabel>Support</SectionLabel>
      <SectionCard>
        <MenuRow
          icon={Icons.helpCircle}
          label="Help & FAQs"
          href="/help"
        />
        <MenuRow
          icon={Icons.messageSend}
          label="Send Feedback"
          href="mailto:feedback@verzatv.com"
          external
        />
        <MenuRow
          icon={Icons.alertTriangle}
          label="Report a Problem"
          href="mailto:support@verzatv.com"
          external
          last
        />
      </SectionCard>

      {/* ---- Legal ---- */}
      <SectionLabel>Legal</SectionLabel>
      <SectionCard>
        <MenuRow
          icon={Icons.fileText}
          label="Terms of Service"
          href="/terms"
        />
        <MenuRow
          icon={Icons.shield}
          label="Privacy Policy"
          href="/privacy"
        />
        <MenuRow
          icon={Icons.refreshCw}
          label="Refund Policy"
          href="/refund-policy"
          last
        />
      </SectionCard>

      {/* ---- Sign out + version ---- */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <SignOutButton />
        <p className="text-xs" style={{ color: T.textMute }}>
          Verza TV v1.0.0
        </p>
      </div>
    </section>
  );
}
