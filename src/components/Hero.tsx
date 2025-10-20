// src/components/Hero.tsx
import { useEffect, useRef, useState } from "react";
import Section from "./Section";
import { useThor } from "../state/thor";
import ModelViewer from "./ModelViewer";

const TITLES = ["Frontend Developer", "Design lover", "AI Explorer", "Marvel fan"];

export default function Hero() {
  const blobRef = useRef<HTMLDivElement>(null);
  const [titleIndex, setTitleIndex] = useState(0);
  const { on: thorOn } = useThor();

  useEffect(() => {
    const el = blobRef.current;
    if (!el) return;
    const onScroll = () => { el.style.transform = `translate3d(0, ${window.scrollY * 0.08}px, 0)`; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTitleIndex(v => (v + 1) % TITLES.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <Section id="hero" className="relative overflow-hidden">
      <div className="full-bleed absolute inset-0 -z-10">
        <div className="aurora" />
        <div
          ref={blobRef}
          className="absolute right-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full
                     bg-gradient-to-tr from-accent to-accent2 opacity-30 blur-3xl"
        />
      </div>

      <div className="grid items-center gap-10 md:grid-cols-2" style={{ minHeight: "calc(100svh - var(--hdr-h))" }}>
        <div className="reveal max-w-xl">
          <p className="text-xs uppercase tracking-[0.3em] opacity-70">{TITLES[titleIndex]}</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-extrabold leading-tight">
            Building <span className="gradient-text">Bifröst-bright</span> web experiences
          </h1>
          <p className="mt-4 opacity-80">
            Clean code, playful motion, and purposeful design—infused with a little Marvel-grade wonder.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#projects" className="btn btn-primary">View Projects</a>
            <a href="#contact" className="btn btn-outline">Contact</a>
          </div>
        </div>

        {/* Model fully merged with scene (no card chrome) */}
        <div className="reveal">
          <figure className="relative p-0">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "radial-gradient(60% 60% at 70% 30%, rgba(0,0,0,.25), transparent 60%)",
                filter: "blur(28px)",
              }}
            />
            <ModelViewer
              src="/assets/thor-hammer.glb"
              autoRotate
              cameraControls
              exposure={1}
              shadowIntensity={1}
              className="w-full h-[420px] rounded-none"
            />
          </figure>
        </div>
      </div>
    </Section>
  );
}
