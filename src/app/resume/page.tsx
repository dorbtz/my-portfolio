import type { Metadata } from "next";
import { Resume, ResumeJsonLd } from "@/features/resume/Resume";

export const metadata: Metadata = {
  title: "Resume",
  description: "Resume of Dor Ben Tzur — full-stack and AI engineer.",
};

export default function ResumePage() {
  return (
    <main id="main-content" className="min-h-dvh">
      <Resume />
      <ResumeJsonLd />
    </main>
  );
}
