"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center px-4 py-2"
      style={{
        background: "rgba(7, 7, 14, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(224, 17, 95, 0.15)",
      }}
    >
      {/* Left spacer — balances the right slot */}
      <div className="w-10 flex-shrink-0" />

      {/* Logo — centered */}
      <div className="flex-1 flex justify-center">
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
      </div>

      {/* Right side — search icon (or custom slot) */}
      <div className="w-10 flex-shrink-0 flex justify-end">
        {rightSlot}
      </div>
    </header>
  );
}
