"use client";

import Image from "next/image";
import Link from "next/link";
import LangDropdown from "@/components/LangDropdown";
import SearchButton from "@/components/SearchButton";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-3 py-1.5"
      style={{
        background: "rgba(7, 7, 14, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(224, 17, 95, 0.15)",
      }}
    >
      {/* Left — language dropdown */}
      <LangDropdown />

      {/* Center — logo */}
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

      {/* Right — search */}
      <SearchButton />
    </header>
  );
}
