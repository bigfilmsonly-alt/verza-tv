"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5"
      style={{
        background: "rgba(7, 7, 14, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(224, 17, 95, 0.15)",
      }}
    >
      {/* Logo — left */}
      <Link href="/" className="block">
        <Image
          src="/logo.png"
          alt="Verza TV"
          width={120}
          height={37}
          className="object-contain brightness-125"
          priority
        />
      </Link>

      {/* Right side — Follow us + Instagram */}
      <div className="flex items-center gap-2">
        <a
          href="https://www.instagram.com/verzatv"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 no-underline"
          aria-label="Follow Verza TV on Instagram"
        >
          <span
            className="text-[11px] font-semibold"
            style={{ color: "#C0C0CC" }}
          >
            Follow us
          </span>
          <div
            className="relative w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #E0115F, #8B5CF6, #3B82F6)",
              padding: "2.5px",
            }}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: "#07070E" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="play-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#E0115F" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <polygon points="8,5 20,12 8,19" fill="url(#play-grad)" />
              </svg>
            </div>
          </div>
        </a>
      </div>
    </header>
  );
}
