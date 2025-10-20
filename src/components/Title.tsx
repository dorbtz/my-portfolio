// src/components/Title.tsx
type TitleProps = {
  id?: string;             // optional anchor id (if you don't pass, you can keep it on the Section)
  eyebrow?: string;        // small label above title (optional)
  children: string;        // main title text, e.g. "Projects"
  align?: "left" | "center";
  className?: string;
};

export default function Title({ id, eyebrow, children, align = "left", className = "" }: TitleProps) {
  const isCenter = align === "center";
  return (
    <header id={id} className={`section-title ${className}`}>
      {eyebrow ? (
        <p className={`eyebrow ${isCenter ? "text-center" : ""}`}>{eyebrow}</p>
      ) : null}
      <div className={`title-row ${isCenter ? "justify-center" : ""}`}>
        <h2 className={`title-text ${isCenter ? "text-center" : ""}`}>{children}</h2>
        <span className="title-accent" aria-hidden="true" />
      </div>
    </header>
  );
}
