"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  CONTENT_LANGUAGE_OPTIONS,
  CONTENT_RATING_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  isHttpUrl,
} from "@/lib/creator-client";

const T = {
  bg: "#07070E",
  surface: "#12121C",
  raised: "#1A1A26",
  line: "rgba(255,255,255,.1)",
  text: "#F5F4F8",
  textDim: "rgba(255,255,255,0.5)",
  textMute: "rgba(255,255,255,0.35)",
  accent: "#E0115F",
  purple: "#8B5CF6",
  gold: "#F6C800",
  success: "#2ECC71",
};

/* Enum value -> human label maps (shared source with the wizard). */
const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  CONTENT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);
const LANG_LABELS: Record<string, string> = Object.fromEntries(
  CONTENT_LANGUAGE_OPTIONS.map((o) => [o.value, o.label]),
);
const RATING_LABELS: Record<string, string> = Object.fromEntries(
  CONTENT_RATING_OPTIONS.map((o) => [o.value, o.label]),
);

interface QueueItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  aspect_ratio: string;
  duration_seconds: number;
  poster_url: string;
  mux_playback_id: string | null;
  pricing_type: string;
  price_cents: number;
  submitted_at: string | null;
  creators: { handle: string; display_name: string; payout_email: string } | { handle: string; display_name: string; payout_email: string }[] | null;
}

interface DraftSocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  imdb?: string;
}

interface CreatorApp {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  real_name: string | null;
  country: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  social: string | null;
  social_links: DraftSocialLinks | null;
  phone: string | null;
  contact_email: string | null;
  project_pitch: string | null;
  film_link: string | null;
  content_types: string[] | null;
  content_languages: string[] | null;
  finished_titles: number | null;
  content_links: string[] | null;
  total_runtime_minutes: number | null;
  sample_link: string | null;
  content_rating: string | null;
  rights_attested: boolean | null;
  territory: string | null;
  territory_detail: string | null;
  exclusivity: string | null;
  agreement_accepted: boolean | null;
  agreement_version: string | null;
  payout_preference: string | null;
  tax_country: string | null;
  payment_ack: boolean | null;
  reviewer_notes: string | null;
  rejection_reason: string | null;
  status: string;
  payout_email: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

type AppAction = "approve" | "changes" | "decline" | "start_review";

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

/** Human "waiting for" duration since an ISO timestamp. */
function waitingFor(iso: string | null): string {
  if (!iso) return "unknown";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  declined: "Declined",
};

function StatusPill({ status }: { status: string }) {
  const color =
    status === "in_review" ? T.purple : status === "changes_requested" ? T.gold : T.accent;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ background: `${color}22`, color }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide" style={{ color: T.textMute }}>
        {label}
      </span>
      <span className="text-xs leading-relaxed" style={{ color: T.text }}>
        {value}
      </span>
    </div>
  );
}

/** A validated, escaped external link. Renders nothing for non-http(s) input. */
function SafeLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (!isHttpUrl(href)) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-[11px] underline break-all"
      style={{ color: T.accent }}
    >
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Creator application card (full submission + 3-way decision)        */
/* ------------------------------------------------------------------ */
function CreatorAppCard({
  app,
  busy,
  onDecide,
}: {
  app: CreatorApp;
  busy: boolean;
  onDecide: (app: CreatorApp, action: AppAction, text: string) => void;
}) {
  const [mode, setMode] = useState<"none" | "changes" | "decline">("none");
  const [text, setText] = useState("");

  const social = app.social_links ?? {};
  const contentLinks = (app.content_links ?? []).filter(isHttpUrl);
  const types = (app.content_types ?? []).map((t) => TYPE_LABELS[t] ?? t).join(", ");
  const langs = (app.content_languages ?? []).map((l) => LANG_LABELS[l] ?? l).join(", ");

  function submitText(action: "changes" | "decline") {
    if (!text.trim()) return;
    onDecide(app, action, text.trim());
    setText("");
    setMode("none");
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="text-sm font-bold" style={{ color: T.text }}>
            {app.display_name || `@${app.handle}`}
          </p>
          <p className="text-[11px]" style={{ color: T.textMute }}>
            @{app.handle}
            {app.real_name ? ` · ${app.real_name}` : ""}
            {app.country ? ` · ${app.country}` : ""}
          </p>
        </div>
        <StatusPill status={app.status} />
      </div>

      <p className="text-[11px] mb-3" style={{ color: T.textMute }}>
        Submitted {fmtDate(app.submitted_at)} · waiting {waitingFor(app.submitted_at)}
      </p>

      {/* Contact */}
      <p className="text-[11px] mb-3" style={{ color: T.textDim }}>
        {app.contact_email || app.payout_email || "no email"}
        {app.phone ? ` · ${app.phone}` : ""}
      </p>

      {app.bio && (
        <p className="text-xs mb-3 leading-relaxed whitespace-pre-wrap" style={{ color: T.textDim }}>
          {app.bio}
        </p>
      )}

      {/* If this is a resubmission after changes, show the note we sent. */}
      {app.reviewer_notes && (
        <div className="rounded-xl p-3 mb-3" style={{ background: T.raised, border: `1px solid ${T.gold}44` }}>
          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.gold }}>
            Previous reviewer note
          </p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: T.textDim }}>
            {app.reviewer_notes}
          </p>
        </div>
      )}

      {/* Structured fields */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Content types" value={types} />
        <Field label="Languages" value={langs} />
        <Field label="Finished titles" value={app.finished_titles != null ? String(app.finished_titles) : null} />
        <Field
          label="Total runtime"
          value={app.total_runtime_minutes != null ? `${app.total_runtime_minutes} min` : null}
        />
        <Field label="Rating" value={app.content_rating ? RATING_LABELS[app.content_rating] ?? app.content_rating : null} />
        <Field
          label="Rights attested"
          value={app.rights_attested === true ? "Yes" : app.rights_attested === false ? "No" : null}
        />
        <Field
          label="Territory"
          value={
            app.territory === "specified"
              ? `Specified${app.territory_detail ? `: ${app.territory_detail}` : ""}`
              : app.territory === "worldwide"
                ? "Worldwide"
                : null
          }
        />
        <Field
          label="Exclusivity"
          value={
            app.exclusivity === "exclusive"
              ? "Exclusive"
              : app.exclusivity === "non_exclusive"
                ? "Non-exclusive"
                : null
          }
        />
        <Field
          label="Agreement"
          value={
            app.agreement_accepted === true
              ? `Accepted${app.agreement_version ? ` (${app.agreement_version})` : ""}`
              : app.agreement_accepted === false
                ? "Not accepted"
                : null
          }
        />
        <Field label="Payout pref" value={app.payout_preference} />
        <Field label="Tax country" value={app.tax_country} />
        <Field
          label="Payment ack"
          value={app.payment_ack === true ? "Yes" : app.payment_ack === false ? "No" : null}
        />
      </div>

      {/* Legacy pitch (older applications) */}
      {app.project_pitch && (
        <div className="rounded-xl p-3 mb-3" style={{ background: T.raised, border: `1px solid ${T.line}` }}>
          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: T.textMute }}>
            Idea / film pitch
          </p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: T.textDim }}>
            {app.project_pitch}
          </p>
        </div>
      )}

      {/* Every content link, individually openable in a new tab */}
      {contentLinks.length > 0 && (
        <div className="rounded-xl p-3 mb-3" style={{ background: T.raised, border: `1px solid ${T.line}` }}>
          <p className="text-[10px] uppercase tracking-wide mb-2" style={{ color: T.textMute }}>
            Content links ({contentLinks.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {contentLinks.map((link, i) => (
              <SafeLink key={`${link}-${i}`} href={link}>
                {`▶ ${link}`}
              </SafeLink>
            ))}
          </div>
        </div>
      )}

      {/* Sample + legacy single film link */}
      {(app.sample_link || app.film_link) && (
        <div className="flex flex-col gap-1.5 mb-3">
          {app.sample_link && <SafeLink href={app.sample_link}>{`★ Sample: ${app.sample_link}`}</SafeLink>}
          {app.film_link && <SafeLink href={app.film_link}>{`▶ Submitted film: ${app.film_link}`}</SafeLink>}
        </div>
      )}

      {/* Socials + website */}
      {(social.instagram || social.tiktok || social.youtube || social.imdb || app.website || app.social) && (
        <div className="flex flex-col gap-1.5 mb-4">
          {social.instagram && <SafeLink href={social.instagram}>{`Instagram: ${social.instagram}`}</SafeLink>}
          {social.tiktok && <SafeLink href={social.tiktok}>{`TikTok: ${social.tiktok}`}</SafeLink>}
          {social.youtube && <SafeLink href={social.youtube}>{`YouTube: ${social.youtube}`}</SafeLink>}
          {social.imdb && <SafeLink href={social.imdb}>{`IMDb: ${social.imdb}`}</SafeLink>}
          {app.website && <SafeLink href={app.website}>{`Website: ${app.website}`}</SafeLink>}
          {app.social && !isHttpUrl(app.social) && (
            <span className="text-[11px]" style={{ color: T.textMute }}>
              {app.social}
            </span>
          )}
          {app.social && isHttpUrl(app.social) && <SafeLink href={app.social}>{app.social}</SafeLink>}
        </div>
      )}

      {/* Decision UI: feedback / decline textarea when a mode is active */}
      {mode !== "none" && (
        <div className="mb-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            autoFocus
            placeholder={
              mode === "changes"
                ? "What does the creator need to change before resubmitting? (sent to the creator)"
                : "Why is this application being declined? (kept on record)"
            }
            className="w-full rounded-xl p-3 text-xs resize-y"
            style={{ background: T.raised, border: `1px solid ${T.line}`, color: T.text }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => submitText(mode)}
              disabled={busy || !text.trim()}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
              style={{
                background: mode === "changes" ? "rgba(246,200,0,0.18)" : "rgba(224,17,95,0.18)",
                color: mode === "changes" ? T.gold : T.accent,
                opacity: busy || !text.trim() ? 0.5 : 1,
              }}
            >
              {mode === "changes" ? "Send changes request" : "Confirm decline"}
            </button>
            <button
              onClick={() => {
                setMode("none");
                setText("");
              }}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
              style={{ background: T.raised, color: T.textDim }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Primary 3-way decision buttons */}
      {mode === "none" && (
        <div className="flex flex-col gap-2">
          {app.status === "submitted" && (
            <button
              onClick={() => onDecide(app, "start_review", "")}
              disabled={busy}
              className="w-full py-2 rounded-xl text-[11px] font-bold border-0 cursor-pointer"
              style={{ background: `${T.purple}22`, color: T.purple, opacity: busy ? 0.6 : 1 }}
            >
              Start review (claim)
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onDecide(app, "approve", "")}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
              style={{ background: "rgba(46,204,113,0.18)", color: T.success, opacity: busy ? 0.6 : 1 }}
            >
              Approve
            </button>
            <button
              onClick={() => setMode("changes")}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
              style={{ background: "rgba(246,200,0,0.18)", color: T.gold, opacity: busy ? 0.6 : 1 }}
            >
              Request changes
            </button>
            <button
              onClick={() => setMode("decline")}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
              style={{ background: "rgba(224,17,95,0.18)", color: T.accent, opacity: busy ? 0.6 : 1 }}
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main review queue                                                  */
/* ------------------------------------------------------------------ */
export default function AdminReview() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [apps, setApps] = useState<CreatorApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Not logged in. Sign in with an admin account.");
        setLoading(false);
        return;
      }
      setToken(session.access_token);
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [contentRes, appsRes] = await Promise.all([
        fetch("/api/admin/review", { headers, cache: "no-store" }),
        fetch("/api/admin/creators", { headers, cache: "no-store" }),
      ]);
      if (!contentRes.ok) {
        const body = await contentRes.json().catch(() => ({}));
        setError(body.error || `Error ${contentRes.status}`);
        setLoading(false);
        return;
      }
      const contentBody = await contentRes.json();
      setItems(contentBody.items ?? []);
      if (appsRes.ok) {
        const appsBody = await appsRes.json();
        setApps(appsBody.items ?? []);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const decideApp = useCallback(
    async (app: CreatorApp, action: AppAction, text: string) => {
      if (!token) return;
      // Guardrails: changes + decline require non-empty text (also enforced server-side).
      if ((action === "changes" || action === "decline") && !text.trim()) return;

      setBusyId(app.id);
      try {
        const payload: Record<string, unknown> = { id: app.id, action };
        if (action === "changes") payload.feedback = text.trim();
        if (action === "decline") payload.reason = text.trim();

        const res = await fetch("/api/admin/creators", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          if (action === "start_review") {
            // Stays in the queue; just reflect the new status locally.
            setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: "in_review" } : a)));
          } else {
            setApps((prev) => prev.filter((a) => a.id !== app.id));
          }
        } else {
          const body = await res.json().catch(() => ({}));
          alert(body.error || `Error ${res.status}`);
        }
      } finally {
        setBusyId(null);
      }
    },
    [token],
  );

  async function decide(item: QueueItem, action: "approve" | "reject") {
    if (!token) return;
    let reason = "";
    if (action === "reject") {
      reason = window.prompt(`Why is "${item.title}" being rejected? (sent to the creator)`) || "";
      if (!reason.trim()) return;
    }
    setBusyId(item.id);
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: item.id, action, reason }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.error || `Error ${res.status}`);
      }
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: T.bg }}>
        <span className="text-sm" style={{ color: T.textDim }}>
          Loading review queue...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6 text-center" style={{ background: T.bg }}>
        <span className="text-sm" style={{ color: T.accent }}>
          {error}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto" style={{ background: T.bg }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: T.text }}>
        Creator Review Queue
      </h1>
      <p className="text-xs mb-5" style={{ color: T.textMute }}>
        {apps.length} application{apps.length === 1 ? "" : "s"} · {items.length} title
        {items.length === 1 ? "" : "s"} awaiting review
      </p>

      {/* Creator applications */}
      {apps.length > 0 && (
        <div className="mb-7">
          <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
            Creator applications
          </h2>
          <div className="flex flex-col gap-3">
            {apps.map((app) => (
              <CreatorAppCard
                key={app.id}
                app={app}
                busy={busyId === app.id}
                onDecide={decideApp}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
        Content awaiting review
      </h2>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: T.textDim }}>
          Nothing to review right now.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const creator = Array.isArray(item.creators) ? item.creators[0] : item.creators;
            return (
              <div key={item.id} className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                <div
                  className="w-full rounded-xl overflow-hidden mb-3"
                  style={{
                    aspectRatio: item.aspect_ratio === "16:9" ? "16 / 9" : "9 / 16",
                    maxWidth: item.aspect_ratio === "16:9" ? "100%" : 200,
                    margin: item.aspect_ratio === "16:9" ? undefined : "0 auto",
                    background: "#000",
                  }}
                >
                  {item.mux_playback_id ? (
                    <video
                      className="w-full h-full object-contain"
                      controls
                      playsInline
                      poster={`https://image.mux.com/${item.mux_playback_id}/thumbnail.jpg?width=480`}
                      src={`https://stream.mux.com/${item.mux_playback_id}.m3u8`}
                    />
                  ) : null}
                </div>

                <p className="text-sm font-bold" style={{ color: T.text }}>
                  {item.title}
                </p>
                <p className="text-[11px] mb-2" style={{ color: T.textMute }}>
                  @{creator?.handle} · {item.category} ·{" "}
                  {item.pricing_type === "free" ? "Free" : `$${(item.price_cents / 100).toFixed(2)}`}
                </p>
                {item.description && (
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: T.textDim }}>
                    {item.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => decide(item, "approve")}
                    disabled={busyId === item.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
                    style={{ background: "rgba(46,204,113,0.18)", color: T.success, opacity: busyId === item.id ? 0.6 : 1 }}
                  >
                    Approve &amp; publish
                  </button>
                  <button
                    onClick={() => decide(item, "reject")}
                    disabled={busyId === item.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
                    style={{ background: "rgba(224,17,95,0.18)", color: T.accent, opacity: busyId === item.id ? 0.6 : 1 }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
