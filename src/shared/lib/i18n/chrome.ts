/**
 * Chrome / nav / common-UI strings — translated ahead of the AI pipeline.
 * These are short, brand-stable labels worth pinning by hand so the
 * EN/עברית toggle shows real translation immediately. The page-content
 * AI translation (Hero / About / Skills / projects copy / etc.) lives in
 * the AI translate pipeline (translations_cache + ai/translate Server Action).
 *
 * If a string is prose (a sentence the user reads, not a UI label),
 * it belongs in the AI translation cache, not here.
 */
import type { Locale } from "@/shared/lib/theme/types";

type Strings = {
  nav: {
    work: string;
    about: string;
    skills: string;
    resume: string;
    playground: string;
  };
  footer: {
    status: string;
    admin: string;
    builtWith: string;
  };
  status: {
    shipped: string;
    "in-progress": string;
    draft: string;
    archived: string;
  };
  common: {
    allProjects: string;
    visitLive: string;
    sourceOnGithub: string;
    theProblem: string;
    myRole: string;
    whatItDoes: string;
    stack: string;
    tags: string;
  };
  a11y: {
    primaryNav: string;
    siteControls: string;
    visualTheme: string;
    colorScheme: string;
    language: string;
    switchTo: (label: string) => string;
    useSystemScheme: string;
    switchToLight: string;
    switchToDark: string;
  };
};

const EN: Strings = {
  nav: {
    work: "Work",
    about: "About",
    skills: "Skills",
    resume: "Resume",
    playground: "Playground",
  },
  footer: {
    status: "Status",
    admin: "Admin",
    builtWith: "Built with Next.js 16, Supabase, Vercel AI Gateway.",
  },
  status: {
    shipped: "Shipped",
    "in-progress": "In progress",
    draft: "Concept",
    archived: "Archived",
  },
  common: {
    allProjects: "All projects",
    visitLive: "Visit live →",
    sourceOnGithub: "Source on GitHub",
    theProblem: "The problem",
    myRole: "My role",
    whatItDoes: "What it does",
    stack: "Stack",
    tags: "Tags",
  },
  a11y: {
    primaryNav: "Primary",
    siteControls: "Site controls",
    visualTheme: "Visual theme",
    colorScheme: "Color scheme",
    language: "Language",
    switchTo: (label: string) => `Switch to ${label} theme`,
    useSystemScheme: "Use system color scheme",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
  },
};

const HE: Strings = {
  nav: {
    work: "עבודות",
    about: "אודות",
    skills: "מיומנויות",
    resume: "קורות חיים",
    playground: "מגרש משחקים",
  },
  footer: {
    status: "סטטוס",
    admin: "מנהל",
    builtWith: "נבנה עם Next.js 16, Supabase, Vercel AI Gateway.",
  },
  status: {
    shipped: "פורסם",
    "in-progress": "בעבודה",
    draft: "רעיון",
    archived: "בארכיון",
  },
  common: {
    allProjects: "כל הפרויקטים",
    visitLive: "אתר חי ←",
    sourceOnGithub: "קוד מקור ב-GitHub",
    theProblem: "הבעיה",
    myRole: "התפקיד שלי",
    whatItDoes: "מה זה עושה",
    stack: "טכנולוגיות",
    tags: "תגיות",
  },
  a11y: {
    primaryNav: "ניווט ראשי",
    siteControls: "בקרות אתר",
    visualTheme: "ערכת נושא",
    colorScheme: "ערכת צבעים",
    language: "שפה",
    switchTo: (label: string) => `החלף לערכת ${label}`,
    useSystemScheme: "השתמש בערכת המערכת",
    switchToLight: "החלף למצב בהיר",
    switchToDark: "החלף למצב כהה",
  },
};

export function getChromeStrings(locale: Locale): Strings {
  return locale === "he" ? HE : EN;
}
