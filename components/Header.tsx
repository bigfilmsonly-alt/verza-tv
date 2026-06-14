"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5"
      style={{
        background: "rgba(7, 7, 14, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
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

      {/* Instagram — right, live story ring style */}
      <a
        href="https://www.instagram.com/verzatv"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 no-underline"
        aria-label="Verza TV on Instagram"
      >
        <span
          className="text-[11px] font-semibold"
          style={{ color: "#A0A0B0" }}
        >
          @verzatv
        </span>
        <div
          className="relative w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #E0115F, #8B5CF6, #3B82F6)",
            padding: "2px",
          }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: "#07070E" }}
          >
            <Image
              src="/logo.png"
              alt="Verza TV"
              width={28}
              height={28}
              className="object-contain brightness-125"
            />
          </div>
        </div>
      </a>
    </header>
  );
}
