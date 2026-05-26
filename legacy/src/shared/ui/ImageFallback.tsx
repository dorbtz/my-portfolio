import { useState } from "react";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: string;           // tailwind classes for radius
  aspect?: "video" | "square" | "golden"; // 16:9 | 1:1 | 3:2
};

export default function ImageFallback({
  src,
  alt,
  className = "",
  rounded = "rounded-2xl",
  aspect = "video",
}: Props) {
  const [error, setError] = useState(false);

  const valid =
    typeof src === "string" &&
    src.trim().length > 0 &&
    !error;

  const aspectClass =
    aspect === "square" ? "aspect-square" :
    aspect === "golden" ? "aspect-[3/2]" :
    "aspect-video";

  return (
    <div className={`overflow-hidden ${rounded} ${aspectClass} ${className}`}>
      {valid ? (
        <img
          src={src!}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <Placeholder alt={alt} />
      )}
    </div>
  );
}

function Placeholder({ alt }: { alt: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] 
                 text-[11px] text-white/60"
      aria-label={`${alt} (no image)`}
    >
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M21 19V5a2 2 0 0 0-2-2H5C3.89 3 3 3.9 3 5v14a2 2 0 0 0 2 2h14c1.11 0 2-.9 2-2zM8.5 13.5l2.5 3l3.5-4.5L19 18H5l3.5-4.5zM9 9A1.5 1.5 0 1 1 9 12A1.5 1.5 0 0 1 9 9z"/>
        </svg>
        <span>No image</span>
      </div>
    </div>
  );
}
