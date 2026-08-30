"use client";

import { useId, useState } from "react";
import { isHttpUrl, MAX_CONTENT_LINKS, STEP_LABELS } from "@/lib/creator-client";

/* ------------------------------------------------------------------ */
/*  Theme (shared source of truth for CreatorDashboard + the wizard).  */
/*  Superset of lib/theme with the purple/warn tokens the wizard uses. */
/* ------------------------------------------------------------------ */
export const T = {
  bg: "var(--t-bg)",
  surface: "var(--t-surface)",
  raised: "var(--t-raised)",
  line: "rgba(255,255,255,.1)",
  text: "#F5F4F8",
  textDim: "rgba(255,255,255,0.5)",
  textMute: "rgba(255,255,255,0.35)",
  accent: "#E0115F",
  purple: "#8B5CF6",
  success: "#2ECC71",
  warn: "#F6C800",
} as const;

export const input = {
  background: "rgba(255,255,255,0.06)",
  border: `1px solid ${T.line}`,
  color: T.text,
};

export const GRADIENT = `linear-gradient(90deg, ${T.accent}, ${T.purple})`;

/* ------------------------------------------------------------------ */
/*  Presentational primitives                                          */
/* ------------------------------------------------------------------ */
export function Centered({ children }: { children: React.ReactNode }) {
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

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
        style={{ color: T.textMute }}
      >
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

export function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

export function Notice({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-3 text-xs leading-relaxed"
      style={{ background: `${color}14`, border: `1px solid ${color}33`, color }}
    >
      {children}
    </div>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.line}`, ...style }}>
      {children}
    </div>
  );
}

/** Button with a consistent 120ms press-scale. Forwards all button attrs. */
export function Pressable({
  className = "",
  style,
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`active:scale-95 transition-transform border-0 cursor-pointer disabled:cursor-not-allowed ${className}`}
      style={{ transitionDuration: "120ms", ...style }}
      {...rest}
    />
  );
}

function Check({ size = 12, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  ProgressBar: 2px gradient track + 4 dots + review flag             */
/* ------------------------------------------------------------------ */
export function ProgressBar({
  step,
  onDot,
  savedAt,
}: {
  step: number;
  onDot: (n: number) => void;
  savedAt: number | null;
}) {
  const fill = `${(step / 5) * 100}%`;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold h-4" style={{ color: T.success }}>
          {savedAt != null && (
            <span className="inline-flex items-center gap-1">
              <Check size={11} color={T.success} />
              Saved just now
            </span>
          )}
        </span>
        <span className="text-[11px] font-semibold" style={{ color: T.textMute }}>
          Step {Math.min(step, 4)} of 4
        </span>
      </div>

      <div
        className="h-0.5 rounded-full overflow-hidden mb-3"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: fill, background: GRADIENT, transitionDuration: "300ms" }}
        />
      </div>

      <div className="flex items-start justify-between">
        {STEP_LABELS.map((label, idx) => {
          const n = idx + 1;
          const done = n < step;
          const current = n === step;
          return (
            <Dot
              key={n}
              done={done}
              current={current}
              label={label}
              onClick={done ? () => onDot(n) : undefined}
            />
          );
        })}
        {/* Review flag marker (step 5) */}
        <FlagDot done={step > 5} current={step === 5} />
      </div>
    </div>
  );
}

function Dot({
  done,
  current,
  label,
  onClick,
}: {
  done: boolean;
  current: boolean;
  label: string;
  onClick?: () => void;
}) {
  const ring = current ? T.accent : done ? "transparent" : T.line;
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 0 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        aria-label={label}
        className="flex items-center justify-center rounded-full active:scale-95 transition-transform disabled:cursor-default"
        style={{
          width: 20,
          height: 20,
          transitionDuration: "120ms",
          background: done ? GRADIENT : "transparent",
          border: `2px solid ${ring}`,
          cursor: onClick ? "pointer" : "default",
        }}
      >
        {done && <Check size={11} />}
      </button>
      <span
        className={`text-[10px] leading-tight text-center ${current ? "block font-bold" : "hidden min-[380px]:block"}`}
        style={{ color: current ? T.text : T.textMute }}
      >
        {label}
      </span>
    </div>
  );
}

function FlagDot({ done, current }: { done: boolean; current: boolean }) {
  const active = done || current;
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 0 }}>
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 20,
          height: 20,
          background: active ? GRADIENT : "transparent",
          border: `2px solid ${current ? T.accent : active ? "transparent" : T.line}`,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : T.textMute} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      </div>
      <span
        className={`text-[10px] leading-tight text-center ${current ? "block font-bold" : "hidden min-[380px]:block"}`}
        style={{ color: current ? T.text : T.textMute }}
      >
        Review
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PillToggle: accessible multi-select (aria-pressed, press-scale)    */
/* ------------------------------------------------------------------ */
export function PillToggle({
  options,
  selected,
  onToggle,
}: {
  options: readonly { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o.value)}
            className="px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            style={{
              transitionDuration: "120ms",
              background: on ? "rgba(224,17,95,0.15)" : "rgba(255,255,255,0.06)",
              color: on ? T.accent : T.textDim,
              border: `1px solid ${on ? T.accent : T.line}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Disclosure: accessible collapsible section                         */
/* ------------------------------------------------------------------ */
export function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer bg-transparent border-0 p-0"
        style={{ color: T.accent }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 150ms" }}
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        {label}
      </button>
      {open && (
        <div id={panelId} className="mt-3 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ContentLinksField: THE key control (provider-agnostic link list)   */
/* ------------------------------------------------------------------ */
export function ContentLinksField({
  value,
  onChange,
  showErrors,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  showErrors: boolean;
}) {
  const rows = value.length ? value : [""];
  const [blurred, setBlurred] = useState<Record<number, boolean>>({});

  const setAt = (i: number, v: string) => {
    const next = rows.slice();
    next[i] = v;
    onChange(next);
  };
  const removeAt = (i: number) => {
    const next = rows.slice();
    next.splice(i, 1);
    onChange(next.length ? next : [""]);
    setBlurred({});
  };
  const add = () => onChange([...rows, ""]);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => {
        const invalid = row.trim() !== "" && !isHttpUrl(row);
        const showErr = invalid && (showErrors || blurred[i]);
        return (
          <div key={i}>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                inputMode="url"
                value={row}
                onChange={(e) => setAt(i, e.target.value)}
                onBlur={() => setBlurred((b) => ({ ...b, [i]: true }))}
                placeholder="https://drive.google.com/..."
                className="flex-1 min-w-0 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ ...input, borderColor: showErr ? T.accent : T.line }}
              />
              {rows.length > 1 && (
                <Pressable
                  onClick={() => removeAt(i)}
                  aria-label="Remove link"
                  className="flex-shrink-0 flex items-center justify-center rounded-xl"
                  style={{ width: 40, height: 40, background: "rgba(255,255,255,0.06)", color: T.textDim }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Pressable>
              )}
            </div>
            {showErr && (
              <p className="text-[11px] mt-1" style={{ color: T.accent }}>
                Enter a valid link starting with http:// or https://
              </p>
            )}
          </div>
        );
      })}

      <Pressable
        onClick={add}
        disabled={rows.length >= MAX_CONTENT_LINKS}
        className="self-start text-xs font-semibold px-3 py-2 rounded-lg mt-0.5"
        style={{
          background: "rgba(224,17,95,0.12)",
          color: T.accent,
          opacity: rows.length >= MAX_CONTENT_LINKS ? 0.5 : 1,
        }}
      >
        + Add another link
      </Pressable>

      <p className="text-[11px] leading-relaxed" style={{ color: T.textMute }}>
        Share a Drive or Dropbox folder set to anyone-with-the-link can view, or paste individual
        title links.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WizardSkeleton: shimmer stand-in shown while /api/creator/me loads */
/* ------------------------------------------------------------------ */
export function WizardSkeleton() {
  return (
    <section className="px-4 pt-8 pb-28 max-w-md mx-auto" aria-hidden="true">
      <div className="skeleton" style={{ width: 130, height: 22, marginBottom: 16 }} />
      <div className="skeleton" style={{ width: "65%", height: 30, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: "90%", height: 14, marginBottom: 22 }} />
      <div className="skeleton" style={{ width: "100%", height: 2, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: "100%", height: 20, marginBottom: 26 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div className="skeleton" style={{ width: 90, height: 12, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "100%", height: 46 }} />
        </div>
      ))}
    </section>
  );
}
