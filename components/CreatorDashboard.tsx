"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */
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
  warn: "#F6C800",
};

const input = {
  background: "rgba(255,255,255,0.06)",
  border: `1px solid ${T.line}`,
  color: T.text,
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface CreatorProfile {
  handle: string;
  displayName: string;
  bio: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  payoutSplit: number;
}

interface Me {
  authenticated: boolean;
  email?: string;
  muxReady?: boolean;
  creator: CreatorProfile | null;
}

interface ContentItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  aspect_ratio: string;
  duration_seconds: number;
  poster_url: string;
  mux_playback_id: string | null;
  pricing_type: string;
  price_cents: number;
  rejection_reason: string | null;
  created_at: string;
  published_at: string | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: T.textMute },
  uploading: { label: "Uploading", color: T.purple },
  processing: { label: "Processing", color: T.purple },
  ready: { label: "Ready to submit", color: T.success },
  pending_review: { label: "In review", color: T.warn },
  published: { label: "Live", color: T.success },
  rejected: { label: "Needs changes", color: T.accent },
};

/* ================================================================== */
/*  Root                                                               */
/* ================================================================== */
export default function CreatorDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/creator/me", { cache: "no-store" });
      if (res.status === 401) {
        setMe({ authenticated: false, creator: null });
      } else {
        setMe(await res.json());
      }
    } catch {
      setMe({ authenticated: false, creator: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  if (loading) return <Centered>Loading studio…</Centered>;

  if (!me?.authenticated) {
    return (
      <Centered>
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2" style={{ color: T.text }}>
            Creator Studio
          </h1>
          <p className="text-sm mb-6" style={{ color: T.textDim }}>
            Sign in to apply, upload, and manage your channel.
          </p>
          <Link
            href="/sign-in?next=/creator"
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold no-underline"
            style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, color: "#fff" }}
          >
            Sign in
          </Link>
        </div>
      </Centered>
    );
  }

  // No profile yet, or still pending/rejected → application / status screen.
  if (!me.creator || me.creator.status !== "approved") {
    return <ApplyScreen me={me} onSaved={loadMe} />;
  }

  return <ApprovedDashboard me={me} />;
}

/* ================================================================== */
/*  Apply / status screen                                              */
/* ================================================================== */
function ApplyScreen({ me, onSaved }: { me: Me; onSaved: () => void }) {
  const c = me.creator;
  const [form, setForm] = useState({
    displayName: c?.displayName ?? "",
    handle: c?.handle ?? "",
    bio: c?.bio ?? "",
    website: "",
    social: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pending: locked status screen, no resubmit needed.
  if (c?.status === "pending") {
    return (
      <Centered>
        <div className="text-center max-w-sm">
          <Badge color={T.warn}>Application under review</Badge>
          <h1 className="text-xl font-bold mt-4 mb-2" style={{ color: T.text }}>
            You&apos;re in the queue, @{c.handle}
          </h1>
          <p className="text-sm" style={{ color: T.textDim }}>
            Our team reviews new creators within 48 hours. We&apos;ll email{" "}
            {me.email} once you&apos;re approved — then you can start uploading.
          </p>
        </div>
      </Centered>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(body.error || `Error ${res.status}`);
      } else {
        onSaved();
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="px-4 pt-8 pb-16 max-w-md mx-auto">
      <div className="text-center mb-6">
        <Badge color={T.accent}>Creator Program</Badge>
        <h1 className="text-2xl font-bold mt-3 mb-2" style={{ color: T.text }}>
          {c?.status === "rejected" ? "Update your application" : "Apply to create"}
        </h1>
        <p className="text-sm" style={{ color: T.textDim }}>
          Upload vertical or horizontal titles, set your price, and keep{" "}
          {Math.round((c?.payoutSplit ?? 0.8) * 100)}% of every sale.
        </p>
      </div>

      {c?.status === "rejected" && c.rejectionReason && (
        <Notice color={T.accent}>
          Your last application needs changes: {c.rejectionReason}
        </Notice>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Display name *">
          <input
            required
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="Your channel name"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={input}
          />
        </Field>
        <Field label="Handle *" hint="Used in your content links: verzatv.com/watch/handle/…">
          <input
            required
            value={form.handle}
            onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
            placeholder="@yourhandle"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={input}
          />
        </Field>
        <Field label="Bio">
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Tell viewers about your channel"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={input}
          />
        </Field>
        <Field label="Website">
          <input
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://…"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={input}
          />
        </Field>
        <Field label="Primary social">
          <input
            value={form.social}
            onChange={(e) => setForm((f) => ({ ...f, social: e.target.value }))}
            placeholder="@handle (TikTok, Instagram, YouTube)"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={input}
          />
        </Field>

        {err && <Notice color={T.accent}>{err}</Notice>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-4 rounded-xl text-base font-bold border-0 cursor-pointer mt-1"
          style={{
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            color: "#fff",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </section>
  );
}

/* ================================================================== */
/*  Approved dashboard                                                 */
/* ================================================================== */
function ApprovedDashboard({ me }: { me: Me }) {
  const c = me.creator!;
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ContentItem | null>(null);

  const loadContent = useCallback(async () => {
    try {
      const res = await fetch("/api/creator/content", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      setItems(body.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Poll while anything is uploading/processing so statuses advance live.
  useEffect(() => {
    const active = items.some((i) => i.status === "uploading" || i.status === "processing");
    if (!active) return;
    const t = setInterval(loadContent, 4000);
    return () => clearInterval(t);
  }, [items, loadContent]);

  return (
    <section className="px-4 pt-6 pb-20 max-w-md mx-auto">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>
            {c.displayName || `@${c.handle}`}
          </h1>
          <p className="text-xs" style={{ color: T.textMute }}>
            @{c.handle} · {Math.round(c.payoutSplit * 100)}% revenue share
          </p>
        </div>
        <Badge color={T.success}>Approved</Badge>
      </header>

      <EarningsPanel />

      <Uploader muxReady={!!me.muxReady} onCreated={loadContent} />

      <h2 className="text-sm font-bold mt-7 mb-3" style={{ color: T.text }}>
        Your titles
      </h2>
      {loading ? (
        <p className="text-sm" style={{ color: T.textDim }}>
          Loading…
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm" style={{ color: T.textDim }}>
          No titles yet. Upload your first video above.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <ContentCard key={it.id} item={it} onEdit={() => setEditing(it)} onChanged={loadContent} />
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadContent();
          }}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Earnings panel                                                     */
/* ------------------------------------------------------------------ */
function EarningsPanel() {
  const [data, setData] = useState<{
    totals: { titles: number; published: number; sales: number; grossCents: number; creatorCents: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/creator/analytics", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const t = data?.totals;
  return (
    <div
      className="rounded-2xl p-4 grid grid-cols-3 gap-2"
      style={{ background: "rgba(139,92,246,0.08)", border: `1px solid rgba(139,92,246,0.2)` }}
    >
      <Stat label="Earnings" value={t ? money(t.creatorCents) : "—"} accent />
      <Stat label="Sales" value={t ? String(t.sales) : "—"} />
      <Stat label="Live" value={t ? String(t.published) : "—"} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold" style={{ color: accent ? T.success : T.text }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: T.textMute }}>
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Uploader                                                           */
/* ------------------------------------------------------------------ */
function Uploader({ muxReady, onCreated }: { muxReady: boolean; onCreated: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [aspect, setAspect] = useState<"9:16" | "16:9">("9:16");
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function start(file: File) {
    setErr(null);
    setProgress(0);
    try {
      // 1. Create the content row + Mux direct-upload URL.
      const res = await fetch("/api/creator/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || file.name, aspectRatio: aspect }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(body.error || `Error ${res.status}`);
        setProgress(null);
        return;
      }

      // 2. PUT the file straight to Mux with progress.
      await putToMux(body.uploadUrl, file, (p) => setProgress(p));

      setProgress(null);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      onCreated();
    } catch {
      setErr("Upload failed. Please try again.");
      setProgress(null);
    }
  }

  if (!muxReady) {
    return (
      <Notice color={T.warn}>
        Uploads aren&apos;t enabled yet on this environment (missing Mux token).
        Contact the Verza team to provision video uploads.
      </Notice>
    );
  }

  return (
    <div className="rounded-2xl p-4 mt-4" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <p className="text-sm font-bold mb-3" style={{ color: T.text }}>
        Upload a new title
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
        style={input}
      />
      <div className="flex gap-2 mb-3">
        {(["9:16", "16:9"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAspect(a)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold border-0 cursor-pointer"
            style={{
              background: aspect === a ? `rgba(224,17,95,0.15)` : "rgba(255,255,255,0.06)",
              color: aspect === a ? T.accent : T.textDim,
              border: `1px solid ${aspect === a ? T.accent : T.line}`,
            }}
          >
            {a === "9:16" ? "Vertical 9:16" : "Horizontal 16:9"}
          </button>
        ))}
      </div>

      {progress === null ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/quicktime,video/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) start(f);
            }}
            className="block w-full text-xs"
            style={{ color: T.textDim }}
          />
          <p className="text-[11px] mt-2" style={{ color: T.textMute }}>
            MP4 or MOV. Vertical 9:16 or landscape 16:9.
          </p>
        </>
      ) : (
        <div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-full transition-all"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.purple})` }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: T.textDim }}>
            Uploading… {progress}%
          </p>
        </div>
      )}

      {err && <Notice color={T.accent}>{err}</Notice>}
    </div>
  );
}

function putToMux(url: string, file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/* ------------------------------------------------------------------ */
/*  Content card                                                       */
/* ------------------------------------------------------------------ */
function ContentCard({
  item,
  onEdit,
  onChanged,
}: {
  item: ContentItem;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const s = STATUS_LABEL[item.status] ?? { label: item.status, color: T.textMute };
  const canEdit = item.status !== "pending_review" && item.status !== "published";
  const canSubmit = item.status === "ready";

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/creator/content/${item.id}/submit`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setErr(body.error || `Error ${res.status}`);
      else onChanged();
    } finally {
      setBusy(false);
    }
  }

  const poster = item.poster_url || (item.mux_playback_id ? `https://image.mux.com/${item.mux_playback_id}/thumbnail.jpg?width=160` : "");

  return (
    <div className="rounded-2xl p-3 flex gap-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <div
        className="rounded-lg overflow-hidden flex-shrink-0"
        style={{ width: 52, height: 72, background: T.raised }}
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
            {item.title}
          </p>
          <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: s.color }}>
            {s.label}
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: T.textMute }}>
          {item.pricing_type === "free" ? "Free" : money(item.price_cents)} · {item.aspect_ratio}
        </p>

        {item.status === "rejected" && item.rejection_reason && (
          <p className="text-[11px] mt-1" style={{ color: T.accent }}>
            {item.rejection_reason}
          </p>
        )}

        <div className="flex gap-2 mt-2">
          {canEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border-0 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)", color: T.text }}
            >
              Edit
            </button>
          )}
          {canSubmit && (
            <button
              onClick={submit}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold border-0 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, color: "#fff", opacity: busy ? 0.6 : 1 }}
            >
              {busy ? "Submitting…" : "Submit for review"}
            </button>
          )}
          {item.status === "published" && (
            <Link
              href={`/watch/${item.slug}`}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold no-underline"
              style={{ background: "rgba(46,204,113,0.15)", color: T.success }}
            >
              View live
            </Link>
          )}
        </div>
        {err && (
          <p className="text-[11px] mt-1" style={{ color: T.accent }}>
            {err}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit modal (details + pricing)                                     */
/* ------------------------------------------------------------------ */
const CATEGORIES = ["microdrama", "film", "series", "podcast", "creator", "other"];

function EditModal({ item, onClose, onSaved }: { item: ContentItem; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: item.title,
    description: item.description,
    category: item.category,
    poster_url: item.poster_url,
    pricing_type: item.pricing_type,
    price: item.price_cents ? (item.price_cents / 100).toFixed(2) : "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      category: form.category,
      poster_url: form.poster_url,
      pricing_type: form.pricing_type,
    };
    if (form.pricing_type !== "free") payload.price_cents = Math.round(Number(form.price) * 100);
    try {
      const res = await fetch(`/api/creator/content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setErr(body.error || `Error ${res.status}`);
      else onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
        style={{ background: T.bg, border: `1px solid ${T.line}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: T.text }}>
            Edit title
          </h3>
          <button onClick={onClose} className="text-sm border-0 bg-transparent cursor-pointer" style={{ color: T.textDim }}>
            Close
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={input}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={input}
            />
          </Field>
          <Field label="Poster image URL">
            <input
              value={form.poster_url}
              onChange={(e) => setForm((f) => ({ ...f, poster_url: e.target.value }))}
              placeholder="https://…"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={input}
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ ...input, appearance: "none" }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} style={{ background: T.surface }}>
                  {cat}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pricing">
            <div className="flex gap-2">
              {(["free", "ppv"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, pricing_type: p }))}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border-0 cursor-pointer"
                  style={{
                    background: form.pricing_type === p ? "rgba(224,17,95,0.15)" : "rgba(255,255,255,0.06)",
                    color: form.pricing_type === p ? T.accent : T.textDim,
                    border: `1px solid ${form.pricing_type === p ? T.accent : T.line}`,
                  }}
                >
                  {p === "free" ? "Free" : "Pay-per-view"}
                </button>
              ))}
            </div>
          </Field>

          {form.pricing_type !== "free" && (
            <Field label="Price (USD)" hint="$0.99 – $500">
              <input
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="4.99"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={input}
              />
            </Field>
          )}

          {err && <Notice color={T.accent}>{err}</Notice>}

          <button
            onClick={save}
            disabled={busy}
            className="w-full py-3.5 rounded-xl text-sm font-bold border-0 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, color: "#fff", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small shared UI                                                    */
/* ------------------------------------------------------------------ */
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center px-4" style={{ minHeight: "70vh" }}>
      {typeof children === "string" ? (
        <span className="text-sm" style={{ color: T.textDim }}>
          {children}
        </span>
      ) : (
        children
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMute }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] mt-1" style={{ color: T.textMute }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

function Notice({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: `${color}14`, border: `1px solid ${color}33`, color }}>
      {children}
    </div>
  );
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
