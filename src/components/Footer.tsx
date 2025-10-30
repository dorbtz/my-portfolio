export default function Footer() {
  const year = new Date().getFullYear();
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <footer>
      <div className="wrap flex flex-col gap-6 py-10 text-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <p style={{ color: "rgb(var(--color-muted) / 0.78)" }}>
            (c) {year} Dor Ben Tzur. Crafted with React, Vite, Tailwind, and a spark of Thor energy.
          </p>
          <p style={{ color: "rgb(var(--color-muted) / 0.6)" }}>
            Last updated {lastUpdated}. Thoughts?{" "}
            <a href="#contact" className="underline" data-thor-hover style={{ color: "rgb(var(--color-ink))" }}>
            Let's collaborate.
            </a>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm font-semibold" style={{ color: "rgb(var(--color-muted) / 0.75)" }}>
          <a href="#projects" data-thor-hover>
            Projects
          </a>
          <a href="https://github.com/your" data-thor-hover>
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/your" data-thor-hover>
            LinkedIn
          </a>
          <a href="#hero" data-thor-hover>
            Back to top →
          </a>
        </div>
      </div>
    </footer>
  );
}

