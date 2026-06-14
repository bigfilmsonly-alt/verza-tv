"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center px-4 py-2.5"
      style={{
        background: "rgba(7, 7, 14, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Link href="/" className="block">
        <Image
          src="/logo.png"
          alt="Verza TV"
          width={130}
          height={40}
          className="object-contain"
          priority
        />
      </Link>
    </header>
  );
}
