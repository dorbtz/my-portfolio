import type { Metadata } from "next";
import { CaseStudiesIndex } from "@/features/case-studies/CaseStudiesIndex";

export const metadata: Metadata = {
  title: "Case studies",
  description: "Long-form architecture and engineering writeups by Dor Ben Tzur.",
};

export default function CaseStudiesPage() {
  return (
    <main id="main-content" className="min-h-dvh">
      <CaseStudiesIndex />
    </main>
  );
}
