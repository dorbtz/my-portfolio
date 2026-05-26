/**
 * Hebrew profile content — verbatim from the user's Hebrew CV PDF
 * (CV Dor Ben Tzur26 HEB.pdf). Hand-curated, not AI-translated, so
 * the /resume page reads natively when locale=he.
 *
 * Brand names (Next.js, React, Supabase, GitHub, etc.) intentionally
 * stay in Latin script per the Hebrew glossary in translate.ts.
 */
import type { EducationItem, EmploymentItem, MilitaryItem, Profile, SkillGroup } from "@/types/profile";

export const PROFILE_HE: Profile = {
  name: "דור בן צור",
  email: "dbtzur@gmail.com",
  location: "רחובות, ישראל",
  linkedin: "https://www.linkedin.com/in/dorbtz/",
  github: "https://github.com/dorbtz",
  headline: "מפתח Full-Stack ובינה מלאכותית (AI)",
  tagline:
    "פיתוח Full-Stack מואץ בבינה מלאכותית. בונה ומשיק יישומי Web מודרניים ופיצ'רי AI חיים מקצה לקצה.",
  bioShort:
    "מפתח Full-Stack מרחובות. בונה יישומי Web מודרניים ופיצ'רי AI חיים — Next.js, React, Supabase, Vercel AI Gateway.",
  bioLong:
    'מפתח Full-Stack חדשני ובעל מוטיבציה עצמית גבוהה, בעל ניסיון עשיר בתכנון ויישום ארכיטקטורות Web מודרניות, לרבות יישומי תלת-ממד (3D) אינטראקטיביים ופתרונות מבוססי בינה מלאכותית (AI). מיומן בשימוש בכלים טכנולוגיים מתקדמים כגון React Three Fiber, Next.js ו-Supabase, לבניית חוויות משתמש חלקות ומערכות צד-שרת (Backend) יעילות. עובד מקצה לקצה: עיצוב, סכמה, שרת, ממשק, פריסה — ומשלב פיצ\'רי AI גנרטיביים (RAG, סוכנים, פלט מובנה) כחלק מהמוצר. הסטאק היומי שלי הוא Next.js, Supabase ו-Vercel AI Gateway, עם Claude ו-Gemini בלולאת הפיתוח.',
};

export const SKILL_GROUPS_HE: readonly SkillGroup[] = [
  {
    id: "languages",
    label: "שפות תכנות",
    skills: [
      { name: "TypeScript" },
      { name: "Python" },
      { name: "JavaScript" },
      { name: "SQL" },
      { name: "HTML" },
      { name: "CSS" },
    ],
  },
  {
    id: "frontend",
    label: "צד-לקוח (Frontend)",
    skills: [
      { name: "React 19" },
      { name: "Next.js 16" },
      { name: "Tailwind v4" },
      { name: "Three.js" },
      { name: "React Three Fiber" },
      { name: "Framer Motion" },
    ],
  },
  {
    id: "backend",
    label: "צד-שרת ונתונים",
    skills: [
      { name: "Node.js" },
      { name: "Supabase" },
      { name: "PostgreSQL" },
      { name: "REST APIs" },
      { name: "Server Actions" },
      { name: "pgvector" },
    ],
  },
  {
    id: "ai",
    label: "בינה מלאכותית",
    skills: [
      { name: "Vercel AI Gateway" },
      { name: "AI SDK v6" },
      { name: "צינורות RAG" },
      { name: "הנדסת פקודות" },
      { name: "סוכני AI" },
      { name: "Claude · Gemini" },
    ],
  },
  {
    id: "devops",
    label: "DevOps וכלים",
    skills: [
      { name: "Vercel" },
      { name: "Git / GitHub" },
      { name: "Docker" },
      { name: "CI/CD" },
      { name: "Claude Code" },
      { name: "MCP" },
    ],
  },
] as const;

export const EDUCATION_HE: readonly EducationItem[] = [
  {
    title: "בינה מלאכותית גנרטיבית מתקדמת וארכיטקטורות Web מודרניות",
    org: "לימוד עצמי",
    period: "2024 – הווה",
    bullets: [
      "שילוב בינה מלאכותית — כלי בינה מלאכותית גנרטיבית (Gemini, Claude), ארכיטקטורת סוכני AI, הנדסת פקודות (Prompt Engineering)",
      "סביבות פיתוח מודרניות — React Three Fiber (R3F), Three.js, Next.js, Tailwind CSS, Supabase",
    ],
  },
  {
    title: "פיתוח Full Stack Web",
    org: "ג׳ון ברייס, תל אביב",
    period: "2021 – 2022",
    bullets: [
      "שפות תכנות — Python, JavaScript, TypeScript, HTML5, CSS3",
      "צד-לקוח וצד-שרת — React, Node.js, REST APIs, Flask, Django",
      "מסדי נתונים — PostgreSQL, MongoDB, MySQL",
      "כלים — Git/GitHub, Docker",
    ],
  },
] as const;

export const EMPLOYMENT_HE: readonly EmploymentItem[] = [
  {
    title: "מפתח Full-Stack ובינה מלאכותית (AI)",
    org: "עצמאי (Self-Employed)",
    period: "2024 – הווה",
    bullets: [
      'ארכיטקטורת בינה מלאכותית אוטונומית — הנדסתי ופיתחתי מערכת חכמה מסוג "AI Brain" באמצעות Python והנדסת פקודות (Prompt Engineering) מתקדמת, לטובת ניהול (Orchestration) ופריסה של סוכני AI דינמיים המותאמים למטרות ייעודיות.',
      "פיתוח משחקי תלת-ממד — תכננתי ופיתחתי את Nebula-1, משחק דפדפן אסטרטגיה ומדע בדיוני אינטראקטיבי בתלת-ממד, תוך שימוש ב-React Three Fiber (R3F), Three.js וטכנולוגיות Web מודרניות.",
      "פלטפורמות Full-Stack Web — תכננתי ופרסתי (Deployed) ארכיטקטורת תיק עבודות עצמאית ומותאמת אישית (Custom-built), המבוססת על Next.js, Tailwind CSS ו-Supabase (PostgreSQL), עם אינטגרציה חלקה ל-Vercel. (האתר הזה.)",
      "פיתוח מונחה בינה מלאכותית (AI-Driven Development) — האצתי משמעותית מחזורי פיתוח תוכנה מקצה לקצה (End-to-End) על ידי שילוב אקטיבי של כלי בינה מלאכותית גנרטיבית (Gemini, Claude Code) לצורך יצירת אבות-טיפוס (Prototyping) מהירה, פתרון תקלות (Debugging) מורכבות והטמעת פיצ׳רים.",
    ],
  },
  {
    title: "סגן מנהל סניף",
    org: "וולט מרקט, רחובות",
    period: "2023 – 2024",
    bullets: [
      "ניהלתי את התפעול היומיומי והובלתי צוות דינמי לעמידה עקבית ביעדי מפתח עסקיים (KPIs) ואף חצייתם.",
      "ייעלתי תהליכי עבודה (Workflows) וניתחתי מדדים פיננסיים במטרה למקסם את רווחיות הסניף.",
      "שיפרתי את חוויית הלקוח באמצעות פתרון סוגיות שירות ותפעול מורכבות.",
    ],
  },
  {
    title: "נציג תמיכה טכנית ושירות לקוחות",
    org: "עיריית רחובות, רחובות",
    period: "2021 – 2022",
    bullets: [
      "סיפקתי תמיכה טכנית בקו ראשון (Front-line) ופתרון בעיות יעיל עבור תושבי העיר.",
      "ניהלתי היקפים גדולים של נתוני פניות (High-volume inquiries) ועקבתי במדויק אחר תהליכי הפתרון שלהן באמצעות מערכות ה-CRM של העירייה.",
    ],
  },
] as const;

export const MILITARY_HE: readonly MilitaryItem[] = [
  {
    title: 'רס"פ (רב סמל פלוגתי) — מנהל תפעול ולוגיסטיקה',
    org: 'צבא ההגנה לישראל (צה"ל)',
    period: "2015 – 2017",
    description:
      "ניהלתי את המערך הלוגיסטי והתפעול היומיומי של הפלוגה, תוך הובלה וניהול יעיל של צוותים להבטחת יעילות ארגונית מרבית. הובלתי את הטיפול בפרט וברווחת החיילים, תוך טיפוח סביבת עבודה צוותית תומכת, ממושמעת ובעלת מוטיבציה גבוהה.",
  },
  {
    title: "ראש לשכה",
    org: 'צבא ההגנה לישראל (צה"ל)',
    period: "2014 – 2015",
    description:
      "ניהלתי את הפעילות המקיפה של לשכת מפקד בכיר, תוך ניהול ותיאום לוחות זמנים מורכבים, ישיבות חוצות-ארגון ותקשורת אסטרטגית. ניהלתי נתונים ומידע בסביבה דינמית ומרובת-ממשקים, תוך הבטחת ביצוע אדמיניסטרטיבי חלק וללא דופי.",
  },
] as const;

/** Resume section headings + labels, hand-translated for native readability. */
export const RESUME_LABELS_HE = {
  eyebrow: "קורות חיים",
  profile: "פרופיל",
  experience: "תעסוקה",
  education: "השכלה",
  military: 'שירות צבאי (צה"ל)',
  skills: "מיומנויות",
  downloadEn: "הורד את גרסת ה-EN (PDF)",
  downloadHe: "הורד את הגרסה העברית (PDF)",
} as const;

export const RESUME_LABELS_EN = {
  eyebrow: "Resume / CV",
  profile: "Profile",
  experience: "Experience",
  education: "Education",
  military: "Military Service (IDF)",
  skills: "Skills",
  downloadEn: "Download EN (PDF)",
  downloadHe: "Download HE (PDF)",
} as const;
