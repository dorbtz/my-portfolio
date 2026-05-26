import { describe, expect, it } from "vitest";
import { getChromeStrings } from "./chrome";

/**
 * Chrome strings are the canonical hand-translations. If anyone changes a
 * Hebrew nav label, these tests fail — the upgrade should be deliberate.
 */
describe("getChromeStrings — locale routing", () => {
  it("returns English strings for locale=en", () => {
    const s = getChromeStrings("en");
    expect(s.nav.work).toBe("Work");
    expect(s.nav.about).toBe("About");
    expect(s.nav.resume).toBe("Resume");
    expect(s.status.shipped).toBe("Shipped");
    expect(s.status["in-progress"]).toBe("In progress");
    expect(s.common.allProjects).toBe("All projects");
  });

  it("returns researched Hebrew strings for locale=he", () => {
    const s = getChromeStrings("he");
    // Critical conventions (NOT the literal translations):
    expect(s.nav.work).toBe("פרויקטים");           // not "עבודות"
    expect(s.nav.about).toBe("עליי");              // not "אודות"
    expect(s.nav.skills).toBe("כישורים");          // not "מיומנויות"
    expect(s.nav.playground).toBe("מעבדה");        // not "מגרש משחקים"
    expect(s.status.shipped).toBe("הושק");         // not "פורסם"
    expect(s.status["in-progress"]).toBe("בפיתוח"); // not "בעבודה"
    expect(s.common.myRole).toBe("תפקידי");        // not "התפקיד שלי"
    expect(s.common.sourceOnGithub).toBe("קוד ב-GitHub"); // not "קוד מקור"
  });

  it("a11y label switchTo formats a label correctly in both locales", () => {
    expect(getChromeStrings("en").a11y.switchTo("Dark")).toBe("Switch to Dark theme");
    expect(getChromeStrings("he").a11y.switchTo("כהה")).toBe("החלף לערכת כהה");
  });
});
