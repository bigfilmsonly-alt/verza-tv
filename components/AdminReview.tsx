"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

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
  success: "#2ECC71",
};

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

interface CreatorApp {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  website: string | null;
  social: string | null;
  payout_email: string | null;
  created_at: string;
}

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
    load();
  }, [load]);

  async function decideApp(app: CreatorApp, action: "approve" | "reject") {
    if (!token) return;
    let reason = "";
    if (action === "reject") {
      reason = window.prompt(`Why is @${app.handle} being rejected? (sent to the team)`) || "";
      if (!reason.trim()) return;
    }
    setBusyId(app.id);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: app.id, action, reason }),
      });
      if (res.ok) {
        setApps((prev) => prev.filter((a) => a.id !== app.id));
      } else {
        const body = await res.json().catch(() => ({}));
        alert(body.error || `Error ${res.status}`);
      }
    } finally {
      setBusyId(null);
    }
  }

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
          Loading review queue…
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
              <div key={app.id} className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                <p className="text-sm font-bold" style={{ color: T.text }}>
                  {app.display_name || `@${app.handle}`}
                </p>
                <p className="text-[11px] mb-2" style={{ color: T.textMute }}>
                  @{app.handle}
                  {app.payout_email ? ` · ${app.payout_email}` : ""}
                </p>
                {app.bio && (
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: T.textDim }}>
                    {app.bio}
                  </p>
                )}
                {(app.website || app.social) && (
                  <p className="text-[11px] mb-3" style={{ color: T.textMute }}>
                    {app.social ? `${app.social} ` : ""}
                    {app.website ?? ""}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => decideApp(app, "approve")}
                    disabled={busyId === app.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
                    style={{ background: "rgba(46,204,113,0.18)", color: T.success, opacity: busyId === app.id ? 0.6 : 1 }}
                  >
                    Approve creator
                  </button>
                  <button
                    onClick={() => decideApp(app, "reject")}
                    disabled={busyId === app.id}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border-0 cursor-pointer"
                    style={{ background: "rgba(224,17,95,0.18)", color: T.accent, opacity: busyId === app.id ? 0.6 : 1 }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-bold mb-3" style={{ color: T.text }}>
        Content awaiting review
      </h2>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: T.textDim }}>
          Nothing to review right now. 🎉
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
