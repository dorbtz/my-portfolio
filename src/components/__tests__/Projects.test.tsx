/// <reference types="vitest" />
/// <reference types="node" />

import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Projects layout", () => {
  it("keeps heading-to-grid spacing within the mt-8 token (32px)", () => {
    const tokensSource = readFileSync(
      join(__dirname, "..", "projectsTokens.ts"),
      "utf8",
    );

    const headingMatch = tokensSource.match(/PROJECTS_HEADING_MARGIN\s*=\s*"([^"]+)"/);
    const gridMatch = tokensSource.match(/PROJECTS_GRID_SPACING\s*=\s*"([^"]+)"/);

    expect(headingMatch).not.toBeNull();
    expect(gridMatch).not.toBeNull();

    const headingToken = headingMatch?.[1] ?? "";
    const gridToken = gridMatch?.[1] ?? "";

    const spacingMap: Record<string, number> = {
      "mt-0": 0,
      "mt-8": 32,
    };

    render(
      <div>
        <h2 className={headingToken}>Projects</h2>
        <div role="grid" className={gridToken}>
          grid
        </div>
      </div>
    );

    const heading = screen.getByRole("heading", { name: /projects/i, level: 2 });
    const grid = screen.getByRole("grid");

    expect(heading.className).toBe(headingToken);
    expect(grid.className).toBe(gridToken);

    const headingSpacing = spacingMap[headingToken] ?? Number.NaN;
    expect(headingSpacing).toBe(0);

    const gridSpacing = spacingMap[gridToken] ?? Number.POSITIVE_INFINITY;
    expect(gridSpacing).toBeLessThanOrEqual(32);
    expect(gridSpacing).toBeGreaterThan(0);
  });
});
