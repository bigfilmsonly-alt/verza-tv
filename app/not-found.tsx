import Link from "next/link";
import { T } from "@/lib/theme";

export default function NotFound() {
  return (
    <section className="px-4 pt-16 pb-8 text-center" style={{ background: "#07070E", minHeight: "100vh" }}>
      <h1 className="text-6xl font-extrabold mb-4" style={{ color: T.accent }}>
        404
      </h1>
      <p className="text-lg font-semibold mb-2" style={{ color: T.text }}>
        Page not found
      </p>
      <p className="text-sm mb-8" style={{ color: T.textMute }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 rounded-xl text-sm font-bold no-underline"
        style={{ background: T.accent, color: "#fff" }}
      >
        Back to Discover
      </Link>
    </section>
  );
}
