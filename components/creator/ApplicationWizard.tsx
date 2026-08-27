"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AGREEMENT_VERSION,
  CONTENT_LANGUAGE_OPTIONS,
  CONTENT_RATING_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  cleanLinks,
  clampStep,
  emptyDraft,
  hydrateDraft,
  normalizeHandleClient,
  pick,
  STEP_FIELDS,
  STEP_META,
  validateStep,
  type CreatorMe,
  type DraftValues,
} from "@/lib/creator-client";
import {
  Badge,
  Card,
  ContentLinksField,
  Disclosure,
  Field,
  GRADIENT,
  Notice,
  PillToggle,
  Pressable,
  ProgressBar,
  T,
  input,
} from "./ui";

const TAX_COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Mexico",
  "Brazil",
  "Spain",
  "France",
  "Germany",
  "Italy",
  "Nigeria",
  "South Korea",
  "Japan",
  "Philippines",
  "United Arab Emirates",
  "Other",
];

/* ================================================================== */
/*  ApplicationWizard                                                  */
/* ================================================================== */
export default function ApplicationWizard({
  me,
  onSubmitted,
}: {
  me: CreatorMe;
  onSubmitted: () => void;
}) {
  const c = me.creator;
  const reopened = c?.status === "changes_requested";
  const isDraftResume = c?.status === "draft";

  const [form, setForm] = useState<DraftValues>(() => hydrateDraft(me));
  const [step, setStep] = useState<number>(() => (reopened ? 1 : clampStep(c?.currentStep ?? 1)));
  const [dir, setDir] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const firstMount = useRef(true);

  const update = <K extends keyof DraftValues>(k: K, v: DraftValues[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const updateSocial = (k: keyof DraftValues["social"], v: string) =>
    setForm((f) => ({ ...f, social: { ...f.social, [k]: v } }));

  /* Seed the autosave baseline once so we never save an untouched draft. */
  useEffect(() => {
    if (lastSavedRef.current === null) lastSavedRef.current = JSON.stringify(form);
  }, [form]);

  /* Move focus to the step heading on each transition (a11y), not on load. */
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  /**
   * Shared saver, serialized through inFlightRef so writes never overlap.
   * `silent` (the debounced typing safety net) yields to any in-flight save and
   * suppresses the busy state + inline errors. An explicit save (Next) instead
   * waits its turn, so a click can never silently no-op behind an autosave.
   */
  async function postSave(fromStep: number, nextStep: number, silent: boolean): Promise<boolean> {
    if (inFlightRef.current) {
      if (silent) return false;
      await inFlightRef.current.catch(() => {});
    }
    const run = doSave(fromStep, nextStep, silent);
    inFlightRef.current = run;
    try {
      return await run;
    } finally {
      if (inFlightRef.current === run) inFlightRef.current = null;
    }
  }

  async function doSave(fromStep: number, nextStep: number, silent: boolean): Promise<boolean> {
    if (!silent) setSaving(true);
    const snapshot = JSON.stringify(form);
    try {
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "save",
          step: nextStep,
          values: pick(form, STEP_FIELDS[fromStep] ?? []),
        }),
      });
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (!silent) setErr(b.error || "Could not save");
        return false;
      }
      setSavedAt(Date.now());
      lastSavedRef.current = snapshot;
      return true;
    } catch {
      if (!silent) setErr("Network error");
      return false;
    } finally {
      if (!silent) setSaving(false);
    }
  }

  /* Debounced autosave-on-typing: a silent data-loss safety net layered on top
     of save-on-Next, so a mid-step tab close cannot lose typing. */
  useEffect(() => {
    if (step > 4) return;
    const snapshot = JSON.stringify(form);
    if (snapshot === lastSavedRef.current) return;
    const t = setTimeout(() => {
      void postSave(step, step, true);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, step]);

  async function goNext() {
    setTouched(true);
    const problems = validateStep(step, form);
    if (problems.length) {
      setErr(problems[0]);
      return;
    }
    setErr(null);
    const ok = await postSave(step, Math.min(step + 1, 5), false);
    if (!ok) return;
    setDir(1);
    setTouched(false);
    setStep((s) => Math.min(s + 1, 5));
  }

  function goBack() {
    setErr(null);
    setDir(-1);
    setTouched(false);
    setStep((s) => Math.max(s - 1, 1));
  }

  function jumpTo(n: number) {
    setErr(null);
    setDir(n < step ? -1 : 1);
    setTouched(false);
    setStep(n);
  }

  function startOver() {
    // Reset local state only; server data is untouched until the next save.
    setForm(emptyDraft());
    setStep(1);
    setDir(-1);
    setErr(null);
    setTouched(false);
  }

  async function submit() {
    for (const n of [1, 2, 3, 4]) {
      const p = validateStep(n, form);
      if (p.length) {
        setErr(p[0]);
        jumpTo(n);
        return;
      }
    }
    setErr(null);
    // Let any in-flight autosave settle so the submit sees a stable row.
    if (inFlightRef.current) await inFlightRef.current.catch(() => {});
    setSaving(true);
    const run = (async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/creator/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: "submit", values: form }),
        });
        const b = (await res.json().catch(() => ({}))) as { error?: string; step?: number };
        if (!res.ok) {
          setErr(b.error || "Could not submit");
          if (typeof b.step === "number") jumpTo(b.step);
          return false;
        }
        onSubmitted();
        return true;
      } catch {
        setErr("Network error");
        return false;
      } finally {
        setSaving(false);
      }
    })();
    inFlightRef.current = run;
    try {
      await run;
    } finally {
      if (inFlightRef.current === run) inFlightRef.current = null;
    }
  }

  const meta = STEP_META[step];
  const gatesOk = form.rightsAttested && form.agreementAccepted && form.paymentAck;

  return (
    <section className="px-4 pt-8 pb-28 max-w-md mx-auto">
      {reopened && (
        <div className="mb-5">
          <Notice color={T.warn}>
            Our team asked for a few changes:{" "}
            {c?.reviewerNotes || "Please review your answers and resubmit."}
          </Notice>
        </div>
      )}

      {isDraftResume && !reopened && (
        <div
          className="mb-5 rounded-xl p-3 flex items-center justify-between gap-3"
          style={{ background: "rgba(139,92,246,0.10)", border: `1px solid rgba(139,92,246,0.25)` }}
        >
          <p className="text-xs" style={{ color: T.textDim }}>
            Welcome back. Pick up where you left off.
          </p>
          <button
            type="button"
            onClick={startOver}
            className="text-xs font-semibold whitespace-nowrap bg-transparent border-0 cursor-pointer"
            style={{ color: T.accent }}
          >
            Start over
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <Badge color={T.accent}>Creator Application</Badge>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold mt-3 mb-1.5 outline-none"
          style={{ color: T.text }}
        >
          {meta.title}
        </h1>
        <p className="text-sm" style={{ color: T.textDim }}>
          {meta.sub}
        </p>
      </div>

      <ProgressBar step={step} onDot={jumpTo} savedAt={savedAt} />

      <div className="relative overflow-hidden">
        <div key={step} className="wizard-step" data-dir={dir}>
          {step === 1 && <StepAbout form={form} update={update} updateSocial={updateSocial} touched={touched} email={me.email} />}
          {step === 2 && <StepContent form={form} update={update} touched={touched} />}
          {step === 3 && <StepRights form={form} update={update} touched={touched} />}
          {step === 4 && <StepPayment form={form} update={update} touched={touched} />}
          {step === 5 && <StepReview form={form} onEdit={jumpTo} email={me.email} />}
        </div>
      </div>

      {err && (
        <div className="mt-4">
          <Notice color={T.accent}>{err}</Notice>
        </div>
      )}

      <NavBar
        step={step}
        saving={saving}
        onBack={goBack}
        onNext={goNext}
        onSubmit={submit}
        submitDisabled={step === 5 && !gatesOk}
      />
    </section>
  );
}

/* ================================================================== */
/*  Step A: About you                                                  */
/* ================================================================== */
function StepAbout({
  form,
  update,
  updateSocial,
  touched,
  email,
}: {
  form: DraftValues;
  update: <K extends keyof DraftValues>(k: K, v: DraftValues[K]) => void;
  updateSocial: (k: keyof DraftValues["social"], v: string) => void;
  touched: boolean;
  email?: string;
}) {
  const handlePreview = normalizeHandleClient(form.handle || form.displayName);
  return (
    <div className="flex flex-col gap-4">
      <Field label="Display name *" hint="Your public channel name.">
        <input
          value={form.displayName}
          onChange={(e) => update("displayName", e.target.value)}
          placeholder="Your channel name"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ ...input, borderColor: touched && !form.displayName.trim() ? T.accent : T.line }}
        />
      </Field>

      <Field label="Handle *">
        <input
          value={form.handle}
          onChange={(e) => update("handle", e.target.value)}
          placeholder="@yourhandle"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ ...input, borderColor: touched && !handlePreview ? T.accent : T.line }}
        />
        <p className="text-[11px] mt-1" style={{ color: T.textMute }}>
          verzatv.com/c/{handlePreview || "yourhandle"}
        </p>
      </Field>

      <Field label="Profile photo or logo URL">
        <input
          type="url"
          inputMode="url"
          value={form.avatarUrl}
          onChange={(e) => update("avatarUrl", e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={input}
        />
      </Field>

      <Field label="Legal name" hint="Private. Used only for agreements and payouts.">
        <input
          value={form.realName}
          onChange={(e) => update("realName", e.target.value)}
          placeholder="First Last"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={input}
        />
      </Field>

      <Field label="Country">
        <input
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
          placeholder="Where you're based"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={input}
        />
      </Field>

      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value.slice(0, 300))}
          maxLength={300}
          rows={3}
          placeholder="Tell viewers about yourself and your channel."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={input}
        />
        <p className="text-[11px] mt-1 text-right" style={{ color: T.textMute }}>
          {form.bio.length}/300
        </p>
      </Field>

      <Field label="Website">
        <input
          type="url"
          inputMode="url"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={input}
        />
      </Field>

      <Disclosure label="Add social links">
        <SocialInput label="Instagram" value={form.social.instagram} onChange={(v) => updateSocial("instagram", v)} />
        <SocialInput label="TikTok" value={form.social.tiktok} onChange={(v) => updateSocial("tiktok", v)} />
        <SocialInput label="YouTube" value={form.social.youtube} onChange={(v) => updateSocial("youtube", v)} />
        <SocialInput label="IMDb" value={form.social.imdb} onChange={(v) => updateSocial("imdb", v)} />
      </Disclosure>

      {email && (
        <p className="text-[11px]" style={{ color: T.textMute }}>
          We&apos;ll email decisions to {email}.
        </p>
      )}
    </div>
  );
}

function SocialInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="url"
        inputMode="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={input}
      />
    </Field>
  );
}

/* ================================================================== */
/*  Step B: Your content                                               */
/* ================================================================== */
function StepContent({
  form,
  update,
  touched,
}: {
  form: DraftValues;
  update: <K extends keyof DraftValues>(k: K, v: DraftValues[K]) => void;
  touched: boolean;
}) {
  const toggle = (key: "contentTypes" | "contentLanguages", value: string) => {
    const cur = form[key];
    update(key, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]);
  };
  return (
    <div className="flex flex-col gap-5">
      <Field label="What do you make? *">
        <PillToggle
          options={CONTENT_TYPE_OPTIONS}
          selected={form.contentTypes}
          onToggle={(v) => toggle("contentTypes", v)}
        />
        {touched && form.contentTypes.length < 1 && (
          <p className="text-[11px] mt-1.5" style={{ color: T.accent }}>
            Pick at least one content type.
          </p>
        )}
      </Field>

      <Field label="Languages">
        <PillToggle
          options={CONTENT_LANGUAGE_OPTIONS}
          selected={form.contentLanguages}
          onToggle={(v) => toggle("contentLanguages", v)}
        />
      </Field>

      <Field label="Content links *">
        <ContentLinksField
          value={form.contentLinks}
          onChange={(v) => update("contentLinks", v)}
          showErrors={touched}
        />
        {touched && cleanLinks(form.contentLinks).length < 1 && (
          <p className="text-[11px] mt-1.5" style={{ color: T.accent }}>
            Add at least one valid link starting with http:// or https://.
          </p>
        )}
      </Field>

      <Field label="Finished titles" hint="How many completed titles do you have?">
        <input
          inputMode="numeric"
          value={form.finishedTitles}
          onChange={(e) => update("finishedTitles", e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
          placeholder="0"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={input}
        />
      </Field>

      <Field label="Total runtime (minutes)" hint="Optional. Approximate total across your titles.">
        <input
          inputMode="numeric"
          value={form.totalRuntimeMinutes}
          onChange={(e) =>
            update("totalRuntimeMinutes", e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
          }
          placeholder="0"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={input}
        />
      </Field>

      <Field label="Sample link" hint="Recommended. A single best title for a quick first look.">
        <input
          type="url"
          inputMode="url"
          value={form.sampleLink}
          onChange={(e) => update("sampleLink", e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={input}
        />
      </Field>

      <Field label="Content rating">
        <Segmented
          options={CONTENT_RATING_OPTIONS}
          value={form.contentRating}
          onChange={(v) => update("contentRating", v)}
        />
      </Field>
    </div>
  );
}

/* ================================================================== */
/*  Step C: Rights & terms                                             */
/* ================================================================== */
function StepRights({
  form,
  update,
  touched,
}: {
  form: DraftValues;
  update: <K extends keyof DraftValues>(k: K, v: DraftValues[K]) => void;
  touched: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <CheckRow
        checked={form.rightsAttested}
        onChange={(v) => update("rightsAttested", v)}
        invalid={touched && !form.rightsAttested}
      >
        I own or control the rights to the content I&apos;m submitting.
      </CheckRow>

      <Field label="Territory *">
        <Segmented
          options={[
            { value: "worldwide", label: "Worldwide" },
            { value: "specified", label: "Specific regions" },
          ]}
          value={form.territory}
          onChange={(v) => update("territory", v as DraftValues["territory"])}
        />
        {form.territory === "specified" && (
          <textarea
            value={form.territoryDetail}
            onChange={(e) => update("territoryDetail", e.target.value)}
            rows={2}
            placeholder="List the countries or regions you can license."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mt-2"
            style={{
              ...input,
              borderColor: touched && !form.territoryDetail.trim() ? T.accent : T.line,
            }}
          />
        )}
      </Field>

      <Field label="Exclusivity *" hint="Non-exclusive means you can also license this elsewhere.">
        <Segmented
          options={[
            { value: "exclusive", label: "Exclusive" },
            { value: "non_exclusive", label: "Non-exclusive" },
          ]}
          value={form.exclusivity}
          onChange={(v) => update("exclusivity", v as DraftValues["exclusivity"])}
        />
      </Field>

      <CheckRow
        checked={form.agreementAccepted}
        onChange={(v) => update("agreementAccepted", v)}
        invalid={touched && !form.agreementAccepted}
      >
        I have read and accept the{" "}
        <Link
          href="/legal/creator-agreement"
          target="_blank"
          rel="noopener"
          style={{ color: T.accent, textDecoration: "underline" }}
        >
          VERZA Creator Agreement
        </Link>{" "}
        (80/20 revenue split).
      </CheckRow>
    </div>
  );
}

/* ================================================================== */
/*  Step D: Payment readiness                                          */
/* ================================================================== */
function StepPayment({
  form,
  update,
  touched,
}: {
  form: DraftValues;
  update: <K extends keyof DraftValues>(k: K, v: DraftValues[K]) => void;
  touched: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Payout method">
        <div
          className="px-4 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
          style={{
            background: "rgba(224,17,95,0.15)",
            color: T.accent,
            border: `1px solid ${T.accent}`,
          }}
        >
          Stripe (default)
        </div>
      </Field>

      <Field label="Tax country">
        <select
          value={form.taxCountry}
          onChange={(e) => update("taxCountry", e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ ...input, appearance: "none" }}
        >
          <option value="" style={{ background: T.surface }}>
            Select a country
          </option>
          {TAX_COUNTRIES.map((ctry) => (
            <option key={ctry} value={ctry} style={{ background: T.surface }}>
              {ctry}
            </option>
          ))}
        </select>
      </Field>

      <Notice color={T.purple}>
        We never collect bank or tax ID details here. Secure payment and tax setup happen after
        approval, through Stripe.
      </Notice>

      <CheckRow
        checked={form.paymentAck}
        onChange={(v) => update("paymentAck", v)}
        invalid={touched && !form.paymentAck}
      >
        I understand secure payment and tax setup happen after approval, via Stripe.
      </CheckRow>
    </div>
  );
}

/* ================================================================== */
/*  Step Review                                                        */
/* ================================================================== */
function StepReview({
  form,
  onEdit,
  email,
}: {
  form: DraftValues;
  onEdit: (n: number) => void;
  email?: string;
}) {
  const links = cleanLinks(form.contentLinks);
  const socials = (
    [
      ["Instagram", form.social.instagram],
      ["TikTok", form.social.tiktok],
      ["YouTube", form.social.youtube],
      ["IMDb", form.social.imdb],
    ] as const
  ).filter(([, v]) => v);

  const gates: { ok: boolean; label: string; step: number }[] = [
    { ok: form.rightsAttested, label: "Confirm you own or control the rights (Rights & terms).", step: 3 },
    { ok: form.agreementAccepted, label: "Accept the Creator Agreement (Rights & terms).", step: 3 },
    { ok: form.paymentAck, label: "Acknowledge the payment terms (Payment readiness).", step: 4 },
  ];
  const failed = gates.filter((g) => !g.ok);

  return (
    <div className="flex flex-col gap-4">
      <ReviewCard title="About you" step={1} onEdit={onEdit} recap={`@${normalizeHandleClient(form.handle || form.displayName) || "handle"}${form.country ? ` - ${form.country}` : ""}`}>
        <Row k="Display name" v={form.displayName || "-"} />
        <Row k="Handle" v={`verzatv.com/c/${normalizeHandleClient(form.handle || form.displayName) || "-"}`} />
        {form.realName && <Row k="Legal name" v={form.realName} />}
        {form.bio && <Row k="Bio" v={form.bio} />}
        {form.website && <Row k="Website" v={form.website} />}
        {socials.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {socials.map(([label]) => (
              <Chip key={label}>{label}</Chip>
            ))}
          </div>
        )}
      </ReviewCard>

      <ReviewCard
        title="Your content"
        step={2}
        onEdit={onEdit}
        recap={`${links.length} link${links.length === 1 ? "" : "s"}${form.finishedTitles ? ` - ${form.finishedTitles} titles` : ""}`}
      >
        {form.contentTypes.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {form.contentTypes.map((t) => (
              <Chip key={t}>{labelFor(CONTENT_TYPE_OPTIONS, t)}</Chip>
            ))}
          </div>
        )}
        {form.contentLanguages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {form.contentLanguages.map((l) => (
              <Chip key={l}>{labelFor(CONTENT_LANGUAGE_OPTIONS, l)}</Chip>
            ))}
          </div>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: T.textMute }}>
          Links
        </p>
        <ul className="flex flex-col gap-1 mb-1">
          {links.length === 0 ? (
            <li className="text-xs" style={{ color: T.textMute }}>
              No links added.
            </li>
          ) : (
            links.map((l) => (
              <li key={l}>
                <a
                  href={l}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs break-all"
                  style={{ color: T.accent }}
                >
                  {l}
                </a>
              </li>
            ))
          )}
        </ul>
        {form.sampleLink && <Row k="Sample" v={form.sampleLink} />}
        {form.contentRating && <Row k="Rating" v={labelFor(CONTENT_RATING_OPTIONS, form.contentRating)} />}
        {form.totalRuntimeMinutes && <Row k="Total runtime" v={`${form.totalRuntimeMinutes} min`} />}
      </ReviewCard>

      <ReviewCard title="Rights & terms" step={3} onEdit={onEdit} recap={form.territory === "worldwide" ? "Worldwide" : form.territory === "specified" ? "Specific regions" : "-"}>
        <CheckLine ok={form.rightsAttested}>Rights confirmed</CheckLine>
        <CheckLine ok={form.agreementAccepted}>Creator Agreement accepted ({AGREEMENT_VERSION})</CheckLine>
        <Row k="Territory" v={form.territory === "specified" ? form.territoryDetail || "Specific regions" : form.territory || "-"} />
        <Row k="Exclusivity" v={form.exclusivity === "exclusive" ? "Exclusive" : form.exclusivity === "non_exclusive" ? "Non-exclusive" : "-"} />
      </ReviewCard>

      <ReviewCard title="Payment readiness" step={4} onEdit={onEdit} recap={form.taxCountry || "Stripe"}>
        <Row k="Payout" v="Stripe (after approval)" />
        {form.taxCountry && <Row k="Tax country" v={form.taxCountry} />}
        <CheckLine ok={form.paymentAck}>Payment terms acknowledged</CheckLine>
      </ReviewCard>

      {failed.length > 0 && (
        <Notice color={T.accent}>
          Before you can submit:
          <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5">
            {failed.map((g) => (
              <li key={g.label}>
                <button
                  type="button"
                  onClick={() => onEdit(g.step)}
                  className="underline bg-transparent border-0 p-0 cursor-pointer text-left"
                  style={{ color: T.accent }}
                >
                  {g.label}
                </button>
              </li>
            ))}
          </ul>
        </Notice>
      )}

      {email && (
        <p className="text-[11px] text-center" style={{ color: T.textMute }}>
          We&apos;ll email the decision to {email}.
        </p>
      )}
    </div>
  );
}

function ReviewCard({
  title,
  step,
  onEdit,
  recap,
  children,
}: {
  title: string;
  step: number;
  onEdit: (n: number) => void;
  recap?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold" style={{ color: T.text }}>
            {title}
          </h3>
          {recap && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: T.textMute }}>
              {recap}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs font-semibold bg-transparent border-0 cursor-pointer flex-shrink-0"
          style={{ color: T.accent }}
        >
          Edit
        </button>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="flex-shrink-0" style={{ color: T.textMute, minWidth: 96 }}>
        {k}
      </span>
      <span className="break-words" style={{ color: T.textDim }}>
        {v}
      </span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: "rgba(255,255,255,0.06)", color: T.textDim, border: `1px solid ${T.line}` }}
    >
      {children}
    </span>
  );
}

function CheckLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: ok ? T.text : T.textMute }}>
      <span
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 16,
          height: 16,
          background: ok ? T.success : "transparent",
          border: `1px solid ${ok ? T.success : T.line}`,
        }}
      >
        {ok && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Shared step controls                                               */
/* ================================================================== */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
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

function CheckRow({
  checked,
  onChange,
  invalid,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left w-full rounded-xl p-3 cursor-pointer active:scale-[0.99] transition-transform"
      style={{
        transitionDuration: "120ms",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${invalid ? T.accent : checked ? T.accent : T.line}`,
      }}
    >
      <span
        className="flex items-center justify-center rounded-md flex-shrink-0 mt-0.5"
        style={{
          width: 20,
          height: 20,
          background: checked ? GRADIENT : "transparent",
          border: `1px solid ${checked ? "transparent" : T.line}`,
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className="text-sm leading-snug" style={{ color: T.text }}>
        {children}
      </span>
    </button>
  );
}

/* ================================================================== */
/*  Sticky nav bar                                                     */
/* ================================================================== */
function NavBar({
  step,
  saving,
  onBack,
  onNext,
  onSubmit,
  submitDisabled,
}: {
  step: number;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
}) {
  const isReview = step === 5;
  const nextLabel = step === 4 ? "Review" : "Next";
  const rightLabel = isReview ? "Submit application" : nextLabel;
  const rightDisabled = saving || (isReview && submitDisabled);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(7,7,14,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${T.line}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        {step > 1 ? (
          <Pressable
            onClick={onBack}
            disabled={saving}
            className="px-5 py-3.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", color: T.text, border: `1px solid ${T.line}` }}
          >
            Back
          </Pressable>
        ) : (
          <span />
        )}

        <Pressable
          onClick={isReview ? onSubmit : onNext}
          disabled={rightDisabled}
          className="flex-1 py-3.5 rounded-xl text-base font-bold"
          style={{ background: GRADIENT, color: "#fff", opacity: rightDisabled ? 0.55 : 1 }}
        >
          {saving ? "Saving..." : rightLabel}
        </Pressable>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
