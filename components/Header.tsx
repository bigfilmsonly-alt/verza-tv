"use client";

import Image from "next/image";
import Link from "next/link";
import LangDropdown from "@/components/LangDropdown";
import SearchButton from "@/components/SearchButton";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex flex-col"
      style={{
        background: "rgba(7, 7, 14, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.3)",
        // Respect the top safe area (notch / Dynamic Island). Resolves to 0 in a
        // normal browser tab, and to the device inset when installed as a PWA —
        // so the header sits correctly on every iPhone instead of under the island.
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Single row — language, logo, search. */}
      <div className="flex items-center justify-between px-3 py-1">
        {/* Left — language dropdown */}
        <LangDropdown />

        {/* Center — logo, with a brand glow + slow cinematic sheen sweep */}
        <Link href="/" className="logo-shine block">
          <Image
            src="/logo.png"
            alt="VERZA TV"
            width={200}
            height={62}
            className="object-contain"
            priority
          />
        </Link>

        {/* Right — search */}
        <SearchButton />
      </div>
    </header>
  );
}
