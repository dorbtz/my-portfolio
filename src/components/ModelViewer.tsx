// src/components/ModelViewer.tsx
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}

type ModelViewerElement = HTMLElement & {
  exposure?: number;
  shadowIntensity?: number;
  cameraOrbit?: string;
  minCameraOrbit?: string;
  maxCameraOrbit?: string;
  environmentImage?: string;
  toneMapping?: string;
  fieldOfView?: string;
  interactionPrompt?: string;
};

type Orbit = `${number}deg ${number}deg ${number}`;

const ModelViewerTag = "model-viewer" as any;

type Props = {
  src: string;
  alt?: string;
  poster?: string;
  iosSrc?: string;
  reveal?: "auto" | "interaction" | "manual";
  ar?: boolean;
  autoRotate?: boolean;
  autoRotateDelay?: number;
  cameraControls?: boolean;
  exposure?: number;
  shadowIntensity?: number;
  cameraOrbit?: Orbit;
  minCameraOrbit?: Orbit;
  maxCameraOrbit?: Orbit;
  environmentImage?: string;
  toneMapping?: "aces" | "neutral" | "agx";
  fieldOfView?: string;
  interactionPrompt?: "auto" | "none" | string;
  className?: string;
  style?: CSSProperties;
  loadingLabel?: string;
};

function ModelViewerBase({
  src,
  alt = "3D model",
  poster,
  iosSrc,
  reveal = "auto",
  ar = false,
  autoRotate = true,
  autoRotateDelay = 1200,
  cameraControls = true,
  exposure = 1.05,
  shadowIntensity = 1.2,
  cameraOrbit,
  minCameraOrbit,
  maxCameraOrbit,
  environmentImage,
  toneMapping,
  fieldOfView,
  interactionPrompt = "auto",
  className,
  style,
  loadingLabel = "Loading 3D experience…",
}: Props) {
  const ref = useRef<ModelViewerElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function ensureElement() {
      if (typeof window === "undefined") return;
      if (!customElements.get("model-viewer")) {
        await import("@google/model-viewer");
      }
      if (!cancelled) {
        setReady(true);
      }
    }

    ensureElement();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof exposure === "number" && el.exposure !== exposure) {
      el.exposure = exposure;
    }
    if (typeof shadowIntensity === "number" && el.shadowIntensity !== shadowIntensity) {
      el.shadowIntensity = shadowIntensity;
    }
    if (cameraOrbit) el.cameraOrbit = cameraOrbit;
    if (minCameraOrbit) el.minCameraOrbit = minCameraOrbit;
    if (maxCameraOrbit) el.maxCameraOrbit = maxCameraOrbit;
    if (environmentImage) el.environmentImage = environmentImage;
    if (toneMapping) el.toneMapping = toneMapping;
    if (fieldOfView) el.fieldOfView = fieldOfView;
    if (interactionPrompt) el.interactionPrompt = interactionPrompt;
  }, [
    exposure,
    shadowIntensity,
    cameraOrbit,
    minCameraOrbit,
    maxCameraOrbit,
    environmentImage,
    toneMapping,
    fieldOfView,
    interactionPrompt,
  ]);

  const arAttributes = useMemo(() => {
    if (!ar) return undefined;
    return {
      ar: true,
      "ar-modes": "webxr scene-viewer quick-look",
      ...(iosSrc ? ({ "ios-src": iosSrc } as const) : {}),
    };
  }, [ar, iosSrc]);

  const autoRotateAttributes = useMemo(() => {
    if (!autoRotate) return undefined;
    return {
      "auto-rotate": true,
      "auto-rotate-delay": autoRotateDelay,
    };
  }, [autoRotate, autoRotateDelay]);

  const cameraControlAttributes = useMemo(() => {
    if (!cameraControls) return undefined;
    return { "camera-controls": true as const };
  }, [cameraControls]);

  if (!ready) {
    return (
      <div
        className={`grid aspect-video place-items-center rounded-[32px] border border-white/10 bg-white/[0.02] text-xs uppercase tracking-[0.24em] ${className ?? ""}`}
        style={{ color: "rgb(var(--color-muted) / 0.68)", ...(style || {}) }}
        aria-label={loadingLabel}
      >
        {loadingLabel}
      </div>
    );
  }

  return (
    <ModelViewerTag
      ref={ref}
      src={src}
      alt={alt}
      poster={poster}
      reveal={reveal}
      {...(cameraControlAttributes ?? {})}
      {...autoRotateAttributes}
      {...(arAttributes ?? {})}
      style={{ background: "transparent", ...(style || {}) }}
      className={className ?? undefined}
    />
  );
}

export default memo(ModelViewerBase);





