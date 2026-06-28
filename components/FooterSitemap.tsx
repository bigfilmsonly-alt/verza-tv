"use client";

import { useState } from "react";
import Link from "next/link";
import { T } from "@/lib/theme";
import { SITEMAP_SECTIONS } from "@/lib/data/sitemap";

export default function FooterSitemap() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="mb-6 flex justify-center">
      {/* The single "Sitemap" tab toggle — stays in the footer */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="flex items-center justify-center gap-1.5"
        style={{
          background: "transparent",
          border: `1px solid ${T.line}`,
          color: T.text,
          fontSize: 12,
          fontWeight: 600,
          padding: "8px 18px",
          borderRadius: 999,
          cursor: "pointer",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Sitemap
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop — z-30 sits BELOW the header (z-40) and bottom nav (z-50)
              so those stay visible and in place while the sitemap is open. */}
          <div
            className="fixed inset-0 z-30"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={close}
          />

          {/* Bottom-sheet panel — anchored above the bottom nav, scrolls on its
              own, constrained to the device frame width. */}
          <div
            className="fixed left-1/2 -translate-x-1/2 w-full z-40 rounded-t-2xl flex flex-col"
            style={{
              maxWidth: 440,
              bottom: 72,
              maxHeight: "62dvh",
              background: T.bg,
              borderTop: `1px solid ${T.line}`,
              boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {/* Sheet header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${T.line}` }}
            >
              <h2
                className="m-0"
                style={{
                  color: T.text,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Sitemap
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close sitemap"
                className="w-7 h-7 flex items-center justify-center rounded-full border-0 cursor-pointer"
                style={{ background: T.raised, color: T.text, fontSize: 16, lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable section grid */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {SITEMAP_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3
                      className="mb-2"
                      style={{
                        color: T.textMute,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {section.hub ? (
                        <Link
                          href={section.hub.href}
                          onClick={close}
                          className="no-underline"
                          style={{ color: T.textMute }}
                        >
                          {section.title}
                        </Link>
                      ) : (
                        section.title
                      )}
                    </h3>
                    <ul className="m-0 p-0" style={{ listStyle: "none" }}>
                      {section.links.map((link) => (
                        <li key={`${section.title}-${link.href}-${link.label}`} className="mb-1.5">
                          {link.external ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={close}
                              className="no-underline transition-opacity hover:opacity-100"
                              style={{ color: T.textDim, fontSize: 11, opacity: 0.85 }}
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              onClick={close}
                              className="no-underline transition-opacity hover:opacity-100"
                              style={{ color: T.textDim, fontSize: 11, opacity: 0.85 }}
                            >
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Full HTML sitemap link */}
              <div className="mt-5 text-center">
                <Link
                  href="/sitemap"
                  onClick={close}
                  className="no-underline"
                  style={{ color: T.accent, fontSize: 11, fontWeight: 600 }}
                >
                  View Full Sitemap &rarr;
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
