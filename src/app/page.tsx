export default function Home() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <section className="glass max-w-xl w-full p-8 sm:p-10 text-center space-y-4">
        <p className="text-caption uppercase tracking-[0.18em] text-muted">
          Portfolio v2 · M1 scaffold
        </p>
        <h1 className="text-display font-bold leading-tight">Dor Ben Tzur</h1>
        <p className="text-body text-muted">
          Full-Stack &amp; AI Engineer. The rebuild is under way — Apple Liquid Glass,
          Vercel AI Gateway, RAG chatbot, Hebrew translation toggle, and two bonus
          themes (Thor &amp; Luffy) are on the way.
        </p>
        <p className="text-body-sm text-muted">
          See{" "}
          <a
            href="https://github.com/dorbtz/my-portfolio/blob/v2-hightech/SPEC.md"
            className="underline decoration-[var(--accent)] underline-offset-4 hover:text-[var(--accent)] transition-colors"
          >
            SPEC.md
          </a>{" "}
          for the architecture.
        </p>
      </section>
    </main>
  );
}
