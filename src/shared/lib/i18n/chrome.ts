/**
 * Chrome / nav / common-UI strings — translated ahead of the AI pipeline.
 * These are short, brand-stable labels worth pinning by hand so the
 * EN/עברית toggle shows real translation immediately. Page-content
 * AI translation (Hero / About / Skills / projects copy / etc.) lives in
 * the translations_cache + ai/translate Server Action.
 *
 * Hebrew translations follow Israeli tech-industry conventions (2026):
 * - Modern conversational register (Google Israel's localization philosophy)
 * - Gender-neutral noun forms (not imperative verbs)
 * - Definite article ה־ properly chained on adjective phrases
 * - Brand names (Next.js, GitHub, etc.) stay in Latin script
 * Sources cross-referenced with cv-hebrew.com, geektime.co.il, makerlab.co.il,
 * Monday.com he-IL, and Wix he-IL UI patterns.
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
    // "פרויקטים" not "עבודות" — Israeli portfolio convention; "עבודות" reads as job listings
    work: "פרויקטים",
    // "עליי" not "אודות" — personal first-person; "אודות" is corporate/About-the-company
    about: "עליי",
    // "כישורים" not "מיומנויות" — LinkedIn/CV-site standard; "מיומנויות" reads as HR/academic
    skills: "כישורים",
    resume: "קורות חיים",
    // "מעבדה" not "מגרש משחקים" — Israeli tech sites use "lab" for demo/experimental areas
    playground: "מעבדה",
  },
  footer: {
    status: "סטטוס",
    // "ניהול" not "מנהל" — what Israeli SaaS admin panels use (Monday.com he-IL pattern)
    admin: "ניהול",
    builtWith: "נבנה עם Next.js 16, Supabase ו-Vercel AI Gateway.",
  },
  status: {
    // "הושק" not "פורסם" — "shipped/launched" in startup parlance; "פורסם" = published (content)
    shipped: "הושק",
    // "בפיתוח" not "בעבודה" — Israeli dev convention; "בעבודה" is generic
    "in-progress": "בפיתוח",
    draft: "רעיון",
    archived: "בארכיון",
  },
  common: {
    // "כל הפרויקטים" — definite ה chained correctly on "הפרויקטים"
    allProjects: "כל הפרויקטים",
    // "לאתר" — concise, directional; "צפה" uses masc imperative (gender issue); "אתר חי" reads as "alive site"
    visitLive: "לאתר ←",
    // "קוד ב-GitHub" — Israeli dev-community phrasing; "מקור" is redundant
    sourceOnGithub: "קוד ב-GitHub",
    theProblem: "הבעיה",
    // "תפקידי" — inflected possessive; tighter than "התפקיד שלי" and more professional
    myRole: "תפקידי",
    whatItDoes: "מה זה עושה",
    // "טכנולוגיות" — what Israeli job posts + GitHub README he-IL use for tech stack
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
