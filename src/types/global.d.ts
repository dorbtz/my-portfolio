import type * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        poster?: string;
        alt?: string;
        ar?: boolean | "true" | "false";
        autoplay?: boolean | "true" | "false";
        "auto-rotate"?: boolean | "true" | "false";
        "camera-controls"?: boolean | "true" | "false";
        "shadow-intensity"?: number | string;
        "auto-rotate-delay"?: number | string;
        "ar-modes"?: string;
        "ios-src"?: string;
        "interaction-prompt"?: string;
        exposure?: number | string;
      };
    }
  }
}

export {};

