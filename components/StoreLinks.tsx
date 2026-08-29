import { STORE_LISTINGS } from "@/lib/app-store";
import HideInIOSApp from "@/components/HideInIOSApp";

/**
 * The two real store listings, as tappable links.
 *
 * Deliberately NOT the official Apple / Google badge artwork: this repo ships
 * no such asset, and inventing a lookalike is worse than plain type. These are
 * text buttons in the app's own scale, which is also what keeps them legible in
 * the footer of every page.
 *
 * Wrapped in HideInIOSApp because inside the native iOS binary a row of store
 * buttons is at best noise and at worst reads as cross-platform steering. This
 * is not a purchase surface, so AGENTS.md rule 11 does not apply — but there is
 * no reason to show it there either.
 */
export default function StoreLinks({
  heading = "Get the app",
  className = "",
}: {
  heading?: string | null;
  className?: string;
}) {
  return (
    <HideInIOSApp>
      <div className={className}>
        {heading ? (
          <p
            className="m-0 mb-2 text-center text-[11px] font-black uppercase tracking-[0.14em]"
            style={{ color: "#8A8A9A" }}
          >
            {heading}
          </p>
        ) : null}
        <div className="flex flex-wrap items-stretch justify-center gap-2">
          {STORE_LISTINGS.map((store) => (
            <a
              key={store.id}
              href={store.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 no-underline rounded-xl px-3.5 py-2 transition-transform active:scale-[0.97]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E0115F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="M7.5 10.5 12 15l4.5-4.5" />
                <path d="M4.5 17.5v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" />
              </svg>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[13px] font-bold" style={{ color: "#F5F4F8" }}>
                  {store.label}
                </span>
                <span className="text-[10px]" style={{ color: "#8A8A9A" }}>
                  {store.devices}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </HideInIOSApp>
  );
}
