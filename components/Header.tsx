"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangDropdown from "@/components/LangDropdown";
import SearchButton from "@/components/SearchButton";
import SummerSaleBadge from "@/components/SummerSaleBadge";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

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
      {/* Row 1 — language, logo, search */}
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

      {/* Row 2 — Summer Sale promo (home only), part of the same sticky box.
          Fixed 44px height so the sticky category tabs below can align exactly. */}
      {isHome && (
        <div className="flex items-center justify-center" style={{ height: 44 }}>
          <SummerSaleBadge />
        </div>
      )}
    </header>
  );
}
