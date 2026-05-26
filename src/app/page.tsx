import { Hero } from "@/features/hero/Hero";
import { About } from "@/features/about/About";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { Skills } from "@/features/skills/Skills";
import { Contact } from "@/features/contact/Contact";

export default function Home() {
  return (
    <main className="min-h-dvh">
      <Hero />
      <About />
      <ProjectsSection />
      <Skills />
      <Contact />
    </main>
  );
}
