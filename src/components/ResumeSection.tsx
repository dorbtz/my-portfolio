export default function ResumeSection() {
  return (
    <section id="resume" className="section">
      <div className="wrap">
        <div className="card reveal print:shadow-none print:border-0 print:p-0">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold">Your Name</h2>
              <p className="opacity-70">Frontend Developer • Design lover • AI Explorer • Marvel fan</p>
            </div>
            <div className="text-sm opacity-80">
              <p>you@example.com</p>
              <p>github.com/your • linkedin.com/in/your</p>
            </div>
          </header>

          <hr className="my-4 border-black/10 dark:border-white/10 print:border-black/20" />

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Experience</h3>
              <ul className="mt-2 space-y-2 text-sm">
                <li><b>Role @ Company</b> — 2023–Present<br/>Built high-perf UI with React/TS/Tailwind; led design systems.</li>
                <li><b>Role @ Company</b> — 2021–2023<br/>Shipped responsive apps; A11y, testing, CI/CD.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Skills</h3>
              <p className="mt-2 text-sm">React, TypeScript, Tailwind, Vite, Node, Testing, A11y, Perf</p>
              <h3 className="mt-4 font-semibold">Education</h3>
              <p className="mt-2 text-sm">B.Sc. (or relevant) — University</p>
            </div>
          </section>

          <div className="mt-4 text-right">
            <button onClick={() => window.print()} className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 print:hidden">
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
