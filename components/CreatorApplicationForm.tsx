"use client";

import { useState } from "react";
import Link from "next/link";

const CONTENT_TYPES = [
  "Drama / Scripted Series",
  "Reality / Docuseries",
  "Comedy / Sketch",
  "Music Videos",
  "Educational / How-To",
  "Lifestyle / Vlogs",
  "Other",
];

export default function CreatorApplicationForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    social: "",
    followers: "",
    contentType: "",
    pitch: "",
    vertical: true,
    horizontal: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          source: "creator_application",
          metadata: {
            name: form.name,
            social: form.social,
            followers: form.followers,
            contentType: form.contentType,
            pitch: form.pitch,
            vertical: form.vertical,
            horizontal: form.horizontal,
          },
        }),
      });
    } catch {}

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <section className="px-4 pt-16 pb-12 flex flex-col items-center justify-center min-h-[70vh]">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "rgba(224,17,95,0.12)" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-3 text-center" style={{ color: "#fff" }}>Application Received</h1>
        <p className="text-sm text-center max-w-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
          Thank you for applying to the Verza TV Creator Program. Our team will review your application and reach out within 48 hours. Early creators get priority placement and promotional support.
        </p>
        <Link
          href="/"
          className="px-8 py-3 rounded-xl text-sm font-bold no-underline transition-transform active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg, #E0115F, #8B5CF6)", color: "#fff" }}
        >
          Back to Verza TV
        </Link>
      </section>
    );
  }

  return (
    <section className="px-4 pt-8 pb-12 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
          style={{ background: "rgba(224,17,95,0.12)", border: "1px solid rgba(224,17,95,0.25)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#E0115F" stroke="none">
            <path d="M12 2l2.09 6.26L20 10l-4.18 4.18L16.36 20 12 16.09 7.64 20l.54-5.82L4 10l5.91-1.74z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#E0115F" }}>Exclusive VIP</span>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#fff" }}>Apply to Become a Creator</h1>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
          Make your own channel, upload vertical or horizontal content, set your subscription pricing, and earn directly from subscribers. Most platforms pay creators pennies. This is different.
        </p>
      </div>

      {/* Benefits */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#8B5CF6" }}>Early Creator Benefits</p>
        <div className="flex flex-col gap-2">
          {[
            "Priority channel placement on Verza TV homepage",
            "Keep up to 80% of subscriber revenue",
            "Upload vertical (9:16) and horizontal (16:9) content",
            "Set your own subscription pricing",
            "Dedicated creator support team",
            "Promotional push to our growing audience",
          ].map((benefit) => (
            <div key={benefit} className="flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Full Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Email *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="creator@example.com"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          />
        </div>

        {/* Social Handle */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Primary Social Handle *
          </label>
          <input
            type="text"
            required
            value={form.social}
            onChange={(e) => update("social", e.target.value)}
            placeholder="@yourhandle (TikTok, Instagram, YouTube)"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          />
        </div>

        {/* Follower Count */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Total Followers (All Platforms)
          </label>
          <select
            value={form.followers}
            onChange={(e) => update("followers", e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: form.followers ? "#fff" : "rgba(255,255,255,0.35)",
              appearance: "none",
            }}
          >
            <option value="" style={{ background: "#12121C" }}>Select range</option>
            <option value="0-1k" style={{ background: "#12121C" }}>Under 1,000</option>
            <option value="1k-10k" style={{ background: "#12121C" }}>1,000 - 10,000</option>
            <option value="10k-50k" style={{ background: "#12121C" }}>10,000 - 50,000</option>
            <option value="50k-100k" style={{ background: "#12121C" }}>50,000 - 100,000</option>
            <option value="100k-500k" style={{ background: "#12121C" }}>100,000 - 500,000</option>
            <option value="500k-1m" style={{ background: "#12121C" }}>500,000 - 1M</option>
            <option value="1m+" style={{ background: "#12121C" }}>1M+</option>
          </select>
        </div>

        {/* Content Type */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Content Type *
          </label>
          <select
            required
            value={form.contentType}
            onChange={(e) => update("contentType", e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: form.contentType ? "#fff" : "rgba(255,255,255,0.35)",
              appearance: "none",
            }}
          >
            <option value="" style={{ background: "#12121C" }}>Select content type</option>
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type} style={{ background: "#12121C" }}>{type}</option>
            ))}
          </select>
        </div>

        {/* Format checkboxes */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Content Format
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.vertical}
                onChange={(e) => update("vertical", e.target.checked)}
                className="w-4 h-4 rounded accent-[#E0115F]"
              />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>Vertical (9:16)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.horizontal}
                onChange={(e) => update("horizontal", e.target.checked)}
                className="w-4 h-4 rounded accent-[#E0115F]"
              />
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>Horizontal (16:9)</span>
            </label>
          </div>
        </div>

        {/* Pitch */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
            Tell Us About Your Content *
          </label>
          <textarea
            required
            value={form.pitch}
            onChange={(e) => update("pitch", e.target.value)}
            placeholder="What kind of content will you create? What makes it unique? Why should viewers subscribe to your channel?"
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl text-base font-bold border-0 cursor-pointer transition-transform active:scale-[0.97] mt-2"
          style={{
            background: "linear-gradient(135deg, #E0115F, #8B5CF6)",
            color: "#fff",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 0 30px rgba(224,17,95,0.25)",
          }}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>

        <p className="text-[11px] text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
          By applying, you agree to the Verza TV <Link href="/terms" className="underline" style={{ color: "rgba(255,255,255,0.4)" }}>Creator Terms</Link>. Applications are reviewed within 48 hours.
        </p>
      </form>
    </section>
  );
}
