"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

/**
 * Project screenshot gallery + in-page lightbox.
 *
 * Grid of themed thumbnails (object-cover, hover zoom + expand affordance).
 * Clicking a shot opens a full-screen lightbox IN-PAGE (not a new tab) showing
 * the whole image (object-contain) with prev/next, a counter, and keyboard
 * control (Esc to close, ←/→ to navigate). The lightbox is portalled to
 * <body> so it escapes any transformed/stacked ancestor.
 */
export function ProjectGallery({
  images,
  title,
  heading,
}: {
  images: string[];
  title: string;
  heading: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock scroll behind the lightbox
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  if (images.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-h3 font-semibold mb-4">{heading}</h2>
      <ul className="project-gallery grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((src, i) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${title} — screenshot ${i + 1}, open larger`}
              className="gallery-shot group relative block w-full aspect-[16/10] overflow-hidden rounded-lg border border-line bg-[color-mix(in_oklab,var(--color-text)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <Image
                src={src}
                alt={`${title} screenshot ${i + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-snap ease-snap group-hover:scale-[1.04]"
              />
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/35 transition-colors duration-snap"
              >
                <span className="grid place-items-center w-11 h-11 rounded-full bg-white/15 text-white text-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-[opacity,transform] duration-snap">
                  ⤢
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {index !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} screenshot ${index + 1} of ${images.length}`}
            onClick={close}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-10 bg-black/85 backdrop-blur-sm animate-[fade-in_180ms_ease-out]"
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-body-sm select-none">
              {index + 1} / {images.length}
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              autoFocus
              className="absolute top-3 right-3 w-11 h-11 grid place-items-center rounded-full bg-white/12 text-white text-2xl hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              ×
            </button>

            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous screenshot"
                className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/12 text-white text-3xl hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                ‹
              </button>
            )}

            <div
              className="relative w-[min(92vw,1400px)] h-[min(82vh,900px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[index]}
                alt={`${title} screenshot ${index + 1}`}
                fill
                sizes="92vw"
                className="object-contain"
                priority
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next screenshot"
                className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full bg-white/12 text-white text-3xl hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                ›
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
