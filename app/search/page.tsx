import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { catalog } from "@/lib/catalog";
import { T } from "@/lib/theme";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return {
      title: "Search Micro-Dramas",
      description:
        "Search 80+ micro-drama series on Verza TV by title, genre, or keyword.",
      alternates: { canonical: "/search" },
    };
  }

  return {
    title: `"${query}" — Search Results`,
    description: `Search results for "${query}" on Verza TV. Find micro-dramas matching your query.`,
    alternates: { canonical: `/search?q=${encodeURIComponent(query)}` },
    robots: { index: false, follow: true },
  };
}

/* ------------------------------------------------------------------ */
/*  Search logic                                                       */
/* ------------------------------------------------------------------ */

function searchCatalog(query: string) {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase();

  return catalog
    .filter((s) => s.status === "live")
    .filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q) ||
        s.logline.toLowerCase().includes(q) ||
        (s.tags && s.tags.some((tag) => tag.toLowerCase().includes(q))) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = searchCatalog(query);

  return (
    <section className="px-4 pt-6 pb-8">
      {/* Back link */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm mb-4 no-underline"
        style={{ color: T.textMute }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Discover
      </Link>

      <h1 className="text-2xl font-bold mb-1" style={{ color: T.text }}>
        {query ? `Results for "${query}"` : "Search Micro-Dramas"}
      </h1>

      {query && (
        <p className="text-sm mb-6" style={{ color: T.textMute }}>
          {results.length} {results.length === 1 ? "series" : "series"} found
        </p>
      )}

      {/* Search form for direct URL access / no-JS */}
      <form action="/search" method="get" className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.textMute}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="16.65" y1="16.65" x2="21" y2="21" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by title, genre, keyword..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: T.surface,
              color: T.text,
              border: `1px solid ${T.line}`,
            }}
          />
        </div>
      </form>

      {/* No query yet */}
      {!query && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: T.surface }}
        >
          <svg
            className="mx-auto mb-3"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.textMute}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="16.65" y1="16.65" x2="21" y2="21" />
          </svg>
          <p className="text-sm mb-1" style={{ color: T.textDim }}>
            Search 80+ micro-drama series
          </p>
          <p className="text-xs" style={{ color: T.textMute }}>
            Try &ldquo;billionaire&rdquo;, &ldquo;revenge&rdquo;, or
            &ldquo;thriller&rdquo;
          </p>
        </div>
      )}

      {/* Query but no results */}
      {query && results.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: T.surface }}
        >
          <p className="text-sm mb-1" style={{ color: T.textDim }}>
            No results for &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs" style={{ color: T.textMute }}>
            Try a different keyword or browse by genre on the{" "}
            <Link
              href="/discover"
              className="underline"
              style={{ color: T.accent }}
            >
              Discover
            </Link>{" "}
            page.
          </p>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {results.map((series) => (
            <Link
              key={series.slug}
              href={`/series/${series.slug}`}
              className="group no-underline"
            >
              <div
                className="relative aspect-[3/4] rounded-lg overflow-hidden mb-1.5"
                style={{ background: T.raised }}
              >
                {series.posterUrl ? (
                  <Image
                    src={series.posterUrl}
                    alt={series.title}
                    fill
                    sizes="(min-width: 768px) 20vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-center px-2"
                    style={{ color: T.textMute }}
                  >
                    {series.title}
                  </div>
                )}
              </div>
              <p
                className="text-xs font-medium truncate"
                style={{ color: T.text }}
              >
                {series.title}
              </p>
              <p className="text-[10px] truncate" style={{ color: T.textMute }}>
                {series.genre}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* SEO footer */}
      <div className="mt-10" style={{ color: T.textMute }}>
        <p className="text-xs leading-relaxed">
          Search across all Verza TV micro-dramas by title, genre, logline, or
          tag. Every series features short-form vertical episodes (60-120
          seconds each), with the first 5 episodes free to watch. Discover
          romance, thriller, mystery, comedy, and more.
        </p>
      </div>
    </section>
  );
}
