import { useState } from "react";
import Section from "./Section";
import Title from "./Title";

const EMAIL = "you@example.com";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [copied, setCopied] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if ((form.elements.namedItem("company") as HTMLInputElement).value) return;
    setStatus("sending");
    window.setTimeout(() => {
      setStatus("sent");
      window.setTimeout(() => setStatus("idle"), 2400);
    }, 900);
  }

  function copyEmail() {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <Section id="contact" label="Contact">
      <Title className="reveal"
        eyebrow="Get in touch"
        description="Let's build a portfolio-worthy experience for your users - Thor mode optional, polish mandatory."
      >
        Ready when you are.
      </Title>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <aside className="glass-tile rounded-2xl p-6 space-y-6">
          <p className="text-base leading-7" style={{ color: "rgb(var(--color-muted) / 0.82)" }}>
            Tell me about your product, team, or wild idea. I'll respond with next steps,
            a timeline, and ways we can bring an Apple-grade experience to life.
          </p>
          <div className="space-y-3 text-sm" style={{ color: "rgb(var(--color-muted) / 0.78)" }}>
            <button
              onClick={copyEmail}
              className="btn btn-outline btn-sm"
              type="button"
              data-thor-hover
            >
              {copied ? "Email copied!" : "Copy email"}
            </button>
            <p>
              Prefer to write directly?{" "}
              <a
                className="underline"
                href={`mailto:${EMAIL}`}
                data-thor-hover
                style={{ color: "rgb(var(--color-ink))" }}
              >
                {EMAIL}
              </a>
            </p>
          </div>
          <div className="grid gap-2 text-sm" style={{ color: "rgb(var(--color-muted) / 0.75)" }}>
            <p>Also available on:</p>
            <div className="flex flex-wrap gap-2">
              <a className="glass-tile rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em]" href="https://github.com/your" data-thor-hover>
                GitHub
              </a>
              <a className="glass-tile rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em]" href="https://www.linkedin.com/in/your" data-thor-hover>
                LinkedIn
              </a>
              <a className="glass-tile rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em]" href="https://dribbble.com/your" data-thor-hover>
                Dribbble
              </a>
            </div>
          </div>
        </aside>

        <form onSubmit={onSubmit} className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.28em]" style={{ color: "rgb(var(--color-muted) / 0.6)" }}>
                Name
              </span>
              <input name="name" className="form-field" placeholder="Your name" required />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.28em]" style={{ color: "rgb(var(--color-muted) / 0.6)" }}>
                Email
              </span>
              <input name="email" type="email" className="form-field" placeholder="Email address" required />
            </label>
          </div>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.28em]" style={{ color: "rgb(var(--color-muted) / 0.6)" }}>
              Project details
            </span>
            <textarea
              name="message"
              rows={5}
              className="form-field"
              placeholder="Share goals, timelines, inspiration…"
              required
            />
          </label>
          <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "rgb(var(--color-muted) / 0.7)" }}>
              Expect a thoughtful reply within two working days.
            </p>
            <button
              disabled={status !== "idle"}
              className="btn btn-primary"
            >
              {status === "sending" ? "Sending…" : status === "sent" ? "Sent!" : "Send message"}
            </button>
          </div>
        </form>
      </div>
    </Section>
  );
}




