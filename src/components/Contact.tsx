import { useState } from "react";
import Section from "./Section";
import Title from "./Title";

export default function Contact() {
  const [status, setStatus] = useState<"idle"|"sending"|"sent">("idle");
  const [copied, setCopied] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if ((form.elements.namedItem("company") as HTMLInputElement).value) return; // honeypot
    setStatus("sending");
    setTimeout(()=> setStatus("sent"), 800);
  }

  function copyEmail() {
    navigator.clipboard.writeText("you@example.com").then(() => {
      setCopied(true); setTimeout(()=>setCopied(false), 1200);
    });
  }

  return (
    <Section id="contact">
      <Title id="contact" eyebrow="Contact" align="left">Contact</Title>
      <div className="mt-4 reveal flex items-center gap-3 text-sm">
        <button onClick={copyEmail} className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
          {copied ? "Copied!" : "Copy email"}
        </button>
        <a href="mailto:you@example.com" className="underline hover:text-accent">or email me</a>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 max-w-xl reveal">
        <input name="name" className="card focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Your name" required />
        <input name="email" type="email" className="card focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Email" required />
        <textarea name="message" rows={5} className="card focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Message" required />
        {/* honeypot */}
        <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
        <button disabled={status!=="idle"} className="btn btn-primary disabled:opacity-60">
          {status==="sending" ? "Sending…" : status==="sent" ? "Sent!" : "Send"}
        </button>
      </form>
    </Section>
  );
}
