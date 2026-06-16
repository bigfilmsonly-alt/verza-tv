import Link from "next/link";
import { T } from "@/lib/theme";

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
        {/* Section 1 — App Store Badges */}
        <div className="flex gap-3 justify-center mb-6">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${T.line}`,
              color: T.text,
              fontSize: 12,
              fontWeight: 500,
              opacity: 0.85,
              cursor: "default",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            App Store
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${T.line}`,
              color: T.text,
              fontSize: 12,
              fontWeight: 500,
              opacity: 0.85,
              cursor: "default",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.4l2.834 1.64a1 1 0 0 1 0 1.74l-2.834 1.64-2.532-2.533 2.532-2.487zM5.864 2.658L16.8 9.007l-2.302 2.285-8.634-8.634z" />
            </svg>
            Google Play
          </span>
        </div>

        {/* Section 2 — Social Links */}
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

        {/* Section 3 — Legal Links */}
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

        {/* Section 4 — Copyright */}
        <p
          className="text-center m-0"
          style={{ color: T.textMute, fontSize: 11 }}
        >
          &copy; 2026 Verza TV. All rights reserved. Microdramas, Reality &amp; More.
        </p>
      </div>
    </footer>
  );
}
