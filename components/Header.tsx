"use client";

import Image from "next/image";
import Link from "next/link";
import LangDropdown from "@/components/LangDropdown";
import SearchButton from "@/components/SearchButton";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-3 py-1"
      style={{
        background: "rgba(7, 7, 14, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.3)",
      }}
    >
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
          priority
        />
      </Link>

      {/* Right — search */}
      <SearchButton />
    </header>
  );
}
