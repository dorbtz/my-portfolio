"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Footer name with a hidden admin entry. Clicking the leading letters of the
 * three words — D, B, T of "Dor Ben Tzur" — in order navigates to /admin.
 * No visible affordance (cursor stays as text, no focus outline, out of the
 * tab order); it's a secret handshake, not a button. Any out-of-order click
 * quietly resets the sequence.
 */
export function FooterName({ name }: { name: string }) {
  const router = useRouter();
  const progress = useRef(0);
  const words = name.split(" ");

  function hit(idx: number) {
    if (idx === progress.current) {
      progress.current += 1;
      if (progress.current >= 3) {
        progress.current = 0;
        router.push("/admin");
      }
    } else {
      // Wrong letter — restart, but credit it if it was the first letter (D).
      progress.current = idx === 0 ? 1 : 0;
    }
  }

  return (
    <p className="font-semibold text-fg">
      {words.map((word, i) => {
        const first = word.charAt(0);
        const rest = word.slice(1);
        const space = i < words.length - 1 ? " " : "";
        // First three words get a hidden clickable initial.
        if (i < 3 && first) {
          return (
            <span key={i}>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => hit(i)}
                style={{ font: "inherit", letterSpacing: "inherit" }}
                className="cursor-text appearance-none border-0 bg-transparent p-0 align-baseline text-fg focus:outline-none"
              >
                {first}
              </button>
              {rest}
              {space}
            </span>
          );
        }
        return (
          <span key={i}>
            {word}
            {space}
          </span>
        );
      })}
    </p>
  );
}
