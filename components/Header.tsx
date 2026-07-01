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
      }}
    >
      {/* Single row — language, logo, search. The Summer Sale $1.99 promo is
          overlaid directly on the hero poster (see BrowsePage) so it never
          pushes the posters down or moves on scroll. */}
      <div className="flex items-center justify-between px-3 py-1">
        {/* Left — language dropdown */}
        <LangDropdown />

        {/* Center — logo */}
        <Link href="/" className="block">
          <Image
            src="/logo.png"
            alt="Verza TV"
            width={150}
            height={40}
            className="object-contain"
            style={{ filter: "brightness(1.4)" }}
            priority
          />
        </Link>

        {/* Right — search */}
        <SearchButton />
      </div>
    </header>
  );
}
