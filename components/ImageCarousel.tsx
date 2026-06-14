"use client";

import { useState } from "react";
import Image from "next/image";
import { T } from "@/lib/theme";

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

export default function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [active, setActive] = useState(0);
  const count = images.length;

  const prev = () => setActive((i) => (i === 0 ? count - 1 : i - 1));
  const next = () => setActive((i) => (i === count - 1 ? 0 : i + 1));

  return (
    <div className="image-carousel relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "1" }}>
      {/* Image */}
      <div className="relative w-full h-full" style={{ background: T.raised }}>
        {images[active] ? (
          <Image
            src={images[active]}
            alt={`${alt} - ${active + 1}`}
            fill
            priority={active === 0}
            sizes="(max-width: 440px) 100vw, 440px"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-base font-bold"
            style={{ color: T.textMute }}
          >
            {alt}
          </div>
        )}
      </div>

      {/* Arrows (only if multiple images) */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer"
            style={{
              background: "rgba(7,7,14,0.65)",
              backdropFilter: "blur(8px)",
              color: "#fff",
            }}
            aria-label="Previous image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer"
            style={{
              background: "rgba(7,7,14,0.65)",
              backdropFilter: "blur(8px)",
              color: "#fff",
            }}
            aria-label="Next image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="p-0 border-0 cursor-pointer"
              style={{ background: "none" }}
              aria-label={`Image ${i + 1}`}
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: i === active ? 18 : 6,
                  height: 6,
                  background: i === active ? T.accent : "rgba(255,255,255,0.5)",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
