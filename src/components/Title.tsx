// src/components/Title.tsx
import type { ReactNode } from "react";

type TitleProps = {
  id?: string;
  eyebrow?: string;
  children: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export default function Title({
  id,
  eyebrow,
  children,
  description,
  align = "left",
  className = "",
}: TitleProps) {
  const isCenter = align === "center";
  const alignText = isCenter ? "text-center" : "text-left";
  const alignContainer = isCenter ? "mx-auto" : "";

  return (
    <header id={id} className={`section-title ${isCenter ? "items-center" : ""} ${className}`.trim()}>
      {eyebrow ? (
        <span className={`eyebrow ${isCenter ? "mx-auto justify-center" : ""}`}>{eyebrow}</span>
      ) : null}
      <div className={`space-y-4 ${isCenter ? "mx-auto max-w-3xl" : "max-w-4xl"}`}>
        <h2 className={`title-text ${alignText}`}>{children}</h2>
        {description ? (
          <div className={`title-meta ${alignText} ${alignContainer}`}>{description}</div>
        ) : null}
      </div>
    </header>
  );
}
