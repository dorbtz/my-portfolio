"use client";

/**
 * Client-side i18n for widgets that can't await localize() server-side
 * (Chatbot, ContactForm, Recommender). Reads the active locale from
 * <html lang="…"> which the public layout already keeps in sync with
 * the pf-locale cookie.
 *
 * Strings are hand-translated for the same reason chrome.ts is: these
 * are short, brand-stable UI labels where AI translation adds latency
 * + risk without benefit.
 */
import { useEffect, useState } from "react";
import type { Locale } from "@/shared/lib/theme/types";

export type ClientStrings = {
  chatbot: {
    triggerLabel: string;          // "Ask my portfolio"
    triggerAria: string;           // "Open AI chat"
    eyebrow: string;               // "AI co-pilot"
    title: string;                 // "Ask my portfolio"
    closeAria: string;             // "Close chat"
    emptyState: string;            // Empty conversation hint
    thinking: string;              // "Thinking…"
    placeholder: string;           // "Ask anything about Dor's work…"
    inputAria: string;             // "Your message"
    send: string;                  // "Send"
    fallbackError: string;         // "Something went wrong."
  };
  contact: {
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    fillAll: string;
    badEmail: string;
    sending: string;
    send: string;
    sentTitle: string;             // "Got it. ✨"
    sentBody: string;
  };
  recommender: {
    eyebrow: string;
    title: string;
    placeholder: string;
    recommend: string;
    picking: string;
    topPicks: string;
    topPicksDegraded: string;
    none: string;
    networkError: string;
    inputAria: string;
  };
};

const EN: ClientStrings = {
  chatbot: {
    triggerLabel: "Ask my portfolio",
    triggerAria: "Open AI chat",
    eyebrow: "AI co-pilot",
    title: "Ask my portfolio",
    closeAria: "Close chat",
    emptyState:
      "Hi — ask about Dor's work, stack, or any project. I can also recommend projects that match a role you're hiring for.",
    thinking: "Thinking…",
    placeholder: "Ask anything about Dor's work…",
    inputAria: "Your message",
    send: "Send",
    fallbackError: "Something went wrong.",
  },
  contact: {
    nameLabel: "Name",
    emailLabel: "Email",
    messageLabel: "Message",
    fillAll: "Please fill in all fields.",
    badEmail: "That email doesn't look right.",
    sending: "Sending…",
    send: "Send",
    sentTitle: "Got it. ✨",
    sentBody: "Your message is in the inbox. I'll reply within a couple of days.",
  },
  recommender: {
    eyebrow: "Hiring? Try the recommender.",
    title: "Tell me what you're building and I'll point you at the matching work.",
    placeholder: 'e.g. "Senior Next.js + AI engineer for an LLM-powered SaaS"',
    recommend: "Recommend",
    picking: "Picking…",
    topPicks: "Top picks",
    topPicksDegraded: "Top picks (AI offline — showing newest)",
    none: "No strong matches in the current portfolio. Email Dor directly.",
    networkError: "Network error — please try again.",
    inputAria: "Role description",
  },
};

const HE: ClientStrings = {
  chatbot: {
    triggerLabel: "שאלו את הפורטפוליו",
    triggerAria: "פתיחת צ׳אט AI",
    eyebrow: "עוזר AI",
    title: "שאלו את הפורטפוליו",
    closeAria: "סגירת הצ׳אט",
    emptyState:
      "היי — אפשר לשאול אותי על הפרויקטים של דור, הסטאק שלו או כל עבודה אחרת. גם ממליץ על פרויקטים שמתאימים לתפקיד שאתם מגייסים אליו.",
    thinking: "חושב…",
    placeholder: "שאלו כל שאלה על העבודה של דור…",
    inputAria: "ההודעה שלכם",
    send: "שליחה",
    fallbackError: "משהו השתבש.",
  },
  contact: {
    nameLabel: "שם",
    emailLabel: "אימייל",
    messageLabel: "הודעה",
    fillAll: "נא למלא את כל השדות.",
    badEmail: "האימייל לא נראה תקין.",
    sending: "שולח…",
    send: "שליחה",
    sentTitle: "התקבל. ✨",
    sentBody: "ההודעה שלכם בתיבה. אחזור אליכם בתוך יום-יומיים.",
  },
  recommender: {
    eyebrow: "מגייסים? נסו את הממליץ.",
    title: "ספרו לי מה אתם בונים ואני אצביע על העבודה שמתאימה.",
    placeholder: 'לדוגמה: "מפתח Next.js ו-AI לסטארטאפ SaaS מבוסס LLM"',
    recommend: "המלצה",
    picking: "בוחר…",
    topPicks: "ההמלצות המובילות",
    topPicksDegraded: "ההמלצות המובילות (ה-AI לא זמין — מציג את החדשים)",
    none: "לא נמצאו התאמות חזקות בפורטפוליו הנוכחי. אפשר לכתוב לדור ישירות.",
    networkError: "שגיאת רשת — נסו שוב.",
    inputAria: "תיאור התפקיד",
  },
};

export function getClientStrings(locale: Locale): ClientStrings {
  return locale === "he" ? HE : EN;
}

/** Reactive locale hook for client widgets. Reads `<html lang>` and
 *  re-renders when the lang attribute changes (LangSwitcher toggle). */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const read = () => {
      const v = document.documentElement.lang;
      setLocale(v === "he" ? "he" : "en");
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => obs.disconnect();
  }, []);
  return locale;
}

/** One-call helper: returns the strings for the active locale + reacts to changes. */
export function useClientStrings(): ClientStrings {
  const locale = useLocale();
  return getClientStrings(locale);
}
