// src/components/ModelViewer.tsx
import { memo, useEffect, useRef } from "react";

/**
 * Lightweight React wrapper around <model-viewer> that avoids
 * Lit's "update scheduled during update" warning by only setting
 * mutable properties when they actually change.
 */

type MVElement = HTMLElement & {
  exposure?: number;
  // note: shadow-intensity is an attribute on the element, not a TS prop
};

type Props = {
  src: string;
  alt?: string;
  autoRotate?: boolean;
  cameraControls?: boolean;
  exposure?: number;         // model-viewer property
  shadowIntensity?: number;  // model-viewer attribute "shadow-intensity"
  className?: string;        // layout class
  style?: React.CSSProperties;
};

function ModelViewerBase({
  src,
  alt = "3D model",
  autoRotate = true,
  cameraControls = true,
  exposure = 1,
  shadowIntensity = 1,
  className,
  style,
}: Props) {
  const ref = useRef<MVElement | null>(null);

  // Set mutable props/attrs only if changed (prevents extra Lit updates)
  useEffect(() => {
    const el = ref.current as any;
    if (!el) return;

    // model-viewer property
    if (el.exposure !== exposure) el.exposure = exposure;

    // model-viewer attribute (string)
    const key = "shadow-intensity";
    if (el.getAttribute(key) !== String(shadowIntensity)) {
      el.setAttribute(key, String(shadowIntensity));
    }
  }, [exposure, shadowIntensity]);

  return (
    <model-viewer
      ref={ref}
      src={src}
      alt={alt}
      // Set boolean attributes once so React doesn't keep toggling them
      {...(autoRotate ? ({ "auto-rotate": true } as any) : {})}
      {...(cameraControls ? ({ "camera-controls": true } as any) : {})}
      // Use class on custom elements; React maps className too, but class is simplest here
      class={className}
      // Keep the background transparent so it merges into your scene
      style={{ background: "transparent", ...(style || {}) }}
    />
  );
}

export default memo(ModelViewerBase);
