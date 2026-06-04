import Image from "next/image";

/** Permanent fallback cover for projects without their own image
 *  (e.g. "coming soon" placeholders). Lives in /public. */
export const PLACEHOLDER_COVER = "/coming_soon.png";

/**
 * Fills a sized, `relative overflow-hidden` parent with a project image while
 * showing the WHOLE image (object-contain) — wide screenshots no longer get
 * cropped. A blurred, scaled copy of the same image sits behind it so the
 * letterbox area reads as a soft cinematic backdrop instead of bare bars.
 * Works in every theme (the parent's per-theme frame/tint applies to both
 * layers). Use inside .project-cover / .project-hero / .gallery-shot wrappers.
 */
export function ProjectMedia({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  /** Extra classes for the foreground (full) image, e.g. a hover scale. */
  className?: string;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        className="object-cover scale-110 blur-2xl opacity-50 pointer-events-none select-none"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={["object-contain", className].filter(Boolean).join(" ")}
      />
    </>
  );
}
