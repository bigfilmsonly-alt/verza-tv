"use client";

import { useId, useState } from "react";

type Status = "idle" | "submitting" | "done" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * CreatorBetaForm — no-auth lead capture for the Profit-Sharing Beta.
 * Collects ONLY name + email, posts to /api/creator/beta, and swaps itself
 * for a friendly confirmation on success. No passwords, no payment, no PII.
 */
export default function CreatorBetaForm() {
  const nameId = useId();
  const emailId = useId();
  const errId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const submitting = status === "submitting";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setStatus("submitting");

    try {
      const res = await fetch("/api/creator/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center"
        role="status"
        aria-live="polite"
        style={{
          background: "linear-gradient(150deg, rgba(224,17,95,0.10), rgba(139,92,246,0.08))",
          border: "1px solid rgba(224,17,95,0.3)",
        }}
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5F4F8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <p className="text-base font-bold" style={{ color: "#F5F4F8" }}>
          You are on the list
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "#A0A0B0" }}>
          We review every application by hand. We will reach out by email if it is a fit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#A0A0B0" }}>
          Your name
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          maxLength={120}
          className="verza-beta-input w-full rounded-xl px-4 py-3 text-[15px] outline-none transition-colors"
          style={{
            background: "#07070E",
            border: "1px solid rgba(224,17,95,0.2)",
            color: "#F5F4F8",
            textAlign: "left",
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#A0A0B0" }}>
          Email address
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          maxLength={200}
          aria-invalid={status === "error" || undefined}
          aria-describedby={error ? errId : undefined}
          className="verza-beta-input w-full rounded-xl px-4 py-3 text-[15px] outline-none transition-colors"
          style={{
            background: "#07070E",
            border: "1px solid rgba(224,17,95,0.2)",
            color: "#F5F4F8",
            textAlign: "left",
          }}
        />
      </div>

      {error && (
        <p id={errId} role="alert" className="text-xs font-medium" style={{ color: "#F87171" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-bold transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
          color: "#FFFFFF",
          boxShadow: "0 8px 28px rgba(224,17,95,0.28)",
        }}
      >
        {submitting && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full"
            style={{ border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#FFFFFF" }}
          />
        )}
        {submitting ? "Sending" : "Apply for the beta"}
      </button>

      <p className="text-center text-xs leading-relaxed" style={{ color: "#6B6B7B" }}>
        Free to apply. We manually approve creators during the beta.
      </p>

      <style>{`
        .verza-beta-input::placeholder { color: #6B6B7B; }
        .verza-beta-input:focus {
          border-color: #E0115F;
          box-shadow: 0 0 0 3px rgba(224,17,95,0.25);
        }
      `}</style>
    </form>
  );
}