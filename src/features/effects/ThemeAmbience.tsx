"use client";

import dynamic from "next/dynamic";

/**
 * Single mount-point for all per-theme atmospheric layers. Each layer
 * is lazy-loaded (ssr:false) and self-gates on the active theme — so
 * the HighTech default ships zero ambience-related JS.
 */

const LuffyImageRain = dynamic(
  () => import("./LuffyImageRain").then((m) => m.LuffyImageRain),
  { ssr: false }
);
const StormFX = dynamic(() => import("./StormFX").then((m) => m.StormFX), { ssr: false });

export function ThemeAmbience() {
  return (
    <>
      <LuffyImageRain />
      <StormFX />
    </>
  );
}
