"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { T } from "@/lib/theme";
import { getSeriesBySlug } from "@/lib/catalog";
import { seriesHref } from "@/lib/series-href";
import EmptyState from "@/components/EmptyState";

/* ------------------------------------------------------------------ */
/*  Purchase history.                                                   */
/*                                                                      */
/*  BUG THIS FIXES: the "Purchase History" row in app/me/page.tsx had    */
/*  href="/me" — its own URL — and the literal string "No purchases"     */
/*  hard-coded beside it. A customer who had bought a Series Unlock had  */
/*  nowhere in the product to see it, and the account page told them     */
/*  they had bought nothing.                                             */
/*                                                                      */
/*  GET /api/entitlements already existed and returned exactly this, and */
/*  had ZERO client callers (Phase 0 §8, row 11).                        */
/*                                                                      */
/*  NO PRICE IS RENDERED HERE, on purpose. AGENTS.md rule 11: the iOS    */
/*  binary must show no web price and no purchase steering. A list of    */
/*  what the account already owns, with no amount and no checkout path,  */
/*  is safe on both platforms and needs no <HideInIOSApp> wrapper —      */
/*  which matters, because that wrapper would blank the page for iOS     */
/*  customers who are exactly the ones asking "what did I buy".          */
/* ------------------------------------------------------------------ */

interface Entitlement {
  id: string;
  series_slug: string;
  created_at: string | null;
}

type State =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "error" }
  | { kind: "ready"; items: Entitlement[] };

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* A receipt rather than EmptyState's default clock: nothing here is late, there
   is simply nothing bought yet. Same 20px stroke and #F5F4F8 as the default. */
const ReceiptGlyph = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5F4F8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

export default function PurchaseHistoryList() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/entitlements")
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 401) {
          setState({ kind: "signed-out" });
          return;
        }
        if (!r.ok) {
          setState({ kind: "error" });
          return;
        }
        const data = (await r.json()) as { entitlements?: Entitlement[] };
        setState({ kind: "ready", items: data.entitlements ?? [] });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => { cancelled = true; };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl animate-pulse" style={{ background: T.surface }}>
            <div className="w-[64px] h-[96px] rounded-lg flex-shrink-0" style={{ background: T.raised }} />
            <div className="flex-1 py-2">
              <div className="h-4 w-3/4 rounded mb-2" style={{ background: T.raised }} />
              <div className="h-3 w-1/3 rounded" style={{ background: T.raised }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (state.kind === "signed-out") {
    return (
      <EmptyState
        glyph={ReceiptGlyph}
        title="Sign in to see your purchases"
        body="Unlocks live on your account, not on this device. Sign in with the email you used at checkout and everything you own appears here."
        action={{ label: "Sign In", href: "/sign-in?next=%2Fme%2Fpurchases" }}
        className="py-6"
        constrain={false}
      />
    );
  }

  if (state.kind === "error") {
    return (
      <EmptyState
        glyph={ReceiptGlyph}
        title="Couldn't load your purchases"
        body="Something went wrong on our side. Your unlocks are safe — reload the page, and if it keeps happening email support@verzatv.com."
        action={{ label: "Contact support", href: "mailto:support@verzatv.com" }}
        className="py-6"
        constrain={false}
      />
    );
  }

  if (state.items.length === 0) {
    return (
      <EmptyState
        glyph={ReceiptGlyph}
        title="No purchases yet"
        body="Every title starts with free episodes. When you unlock one it appears here and stays on your account."
        action={{ label: "Browse VERZA", href: "/" }}
        className="py-6"
        constrain={false}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {state.items.map((e) => {
        const series = getSeriesBySlug(e.series_slug);
        const title = series?.title ?? e.series_slug;
        const when = formatDate(e.created_at);
        return (
          <Link
            key={e.id}
            href={seriesHref(e.series_slug)}
            className="flex gap-3 rounded-xl overflow-hidden no-underline transition-transform active:scale-[0.99]"
            style={{ background: T.surface, border: `1px solid ${T.line}` }}
          >
            <div className="w-[64px] h-[96px] relative flex-shrink-0">
              {series?.posterUrl ? (
                <Image src={series.posterUrl} alt={title} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: T.raised }} />
              )}
            </div>
            <div className="flex-1 py-3 pr-3 flex flex-col justify-center min-w-0">
              <h4 className="text-sm font-semibold truncate" style={{ color: T.text }}>{title}</h4>
              <p className="text-xs mt-1" style={{ color: T.textMute }}>
                Full series unlocked{when ? ` · ${when}` : ""}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
