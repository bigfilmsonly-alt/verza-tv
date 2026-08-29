import Link from "next/link";
import { T } from "@/lib/theme";
import FooterSitemap from "@/components/FooterSitemap";
import StoreLinks from "@/components/StoreLinks";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/verzatv",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@verzatv",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.6 5.82A4.28 4.28 0 0 1 13.37 3h-3.1v12.4a2.59 2.59 0 0 1-2.59 2.59 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 2.59-2.59c.28 0 .55.05.8.13V9.73a5.81 5.81 0 0 0-.8-.06A5.82 5.82 0 0 0 1.86 15.5a5.82 5.82 0 0 0 5.82 5.82 5.82 5.82 0 0 0 5.82-5.82V9.73a7.35 7.35 0 0 0 4.37 1.44V8.06a4.28 4.28 0 0 1-1.27-.24v-2z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com/VerzaTV",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@VerzaTV",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/VerzaTV",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

const legalLinks = [
  { label: "Become a Creator", href: "/studio" },
  { label: "Support", href: "/support" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Help & Support", href: "/help" },
  { label: "Press", href: "/press" },
  { label: "About", href: "/about" },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: T.surface,
        borderTop: `1px solid ${T.line}`,
        color: T.textMute,
        fontSize: 13,
      }}
    >
      <div
        className="mx-auto w-full px-5 py-8"
        style={{ maxWidth: 440 }}
      >
        {/* Section 1 — Social Links */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              title={social.name}
              className="flex items-center gap-1.5 transition-opacity opacity-70 hover:opacity-100"
              style={{ color: T.text, textDecoration: "none", fontSize: 12 }}
            >
              {social.icon}
              <span className="hidden sm:inline">{social.name}</span>
            </a>
          ))}
        </div>

        {/* No products in the footer. They live on /shop, which the bottom nav
            already points at, and on /amazon. A wall of product tiles under
            every page made the whole site feel like an ad. */}

        {/* Section 2 — The apps.
            /about, /press and the platform sentences in the legal copy all
            state that VERZA runs on iPhone, iPad and Android. Until now the
            site carried no route to either store, on any page — a live iOS
            listing and a live Play listing that a visitor could only reach by
            searching for them. The footer is on every page, so this is the one
            placement that makes the claim actionable everywhere. */}
        <StoreLinks className="mb-6" />

        {/* Section 3 — Sitemap dropdown */}
        <FooterSitemap />

        {/* Section 4 — Legal Links */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mb-5">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="no-underline transition-opacity hover:opacity-80"
              style={{ color: T.textMute, fontSize: 12 }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Section 5 — Copyright */}
        <p
          className="text-center m-0"
          style={{ color: T.textMute, fontSize: 11 }}
        >
          &copy; 2026 VERZA TV. All rights reserved. Microdramas, Reality &amp; More.
        </p>
      </div>
    </footer>
  );
}
