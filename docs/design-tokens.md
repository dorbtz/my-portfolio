# Design tokens

This project standardises layout and elevation through a small set of CSS custom properties that are surfaced as Tailwind utilities. Use these tokens whenever you need spacing, radii, or shadows so that components stay consistent between the light and dark themes.

## Spacing scale

Spacing tokens live in `@theme` within `src/index.css` and are exposed to Tailwind via utilities such as `py-space-12` or `gap-space-3`.

| Token | Value | Suggested usage |
| --- | --- | --- |
| `--space-0` | `0rem` | Reset spacing (e.g. `p-space-0`). |
| `--space-1` | `0.25rem` (4px) | Tight gutters on badges or icon buttons. |
| `--space-2` | `0.5rem` (8px) | Small padding on buttons and pills. |
| `--space-3` | `0.75rem` (12px) | Horizontal gaps between heading accents and icons. |
| `--space-4` | `1rem` (16px) | Base grid padding inside the `.wrap` container. |
| `--space-5` | `1.25rem` (20px) | Medium inset spacing or card gutters on compact layouts. |
| `--space-6` | `1.5rem` (24px) | Default card padding and large button padding. |
| `--space-8` | `2rem` (32px) | Dense section padding on mobile or stacked card grids. |
| `--space-10` | `2.5rem` (40px) | Generous breathing room for hero sub-elements. |
| `--space-12` | `3rem` (48px) | Section padding for standard viewports (`py-space-12`). |
| `--space-16` | `4rem` (64px) | Desktop section padding (`md:py-space-16`). |
| `--space-20` | `5rem` (80px) | Long-form or feature sections that need dramatic separation. |

When you need a spacing value outside the scale, confirm with design first; adding one-off values quickly erodes consistency.

## Border radii

| Token | Value | Suggested usage |
| --- | --- | --- |
| `--radius-xl` | `1.25rem` | Default radius for surface cards, buttons, and hero imagery. Apply via Tailwind with `rounded-xl2` or in CSS using the raw variable.

Smaller radii should use Tailwind defaults (`rounded-md`, `rounded-lg`) unless design introduces a new shared token.

## Shadows / elevation

Two elevation levels keep cards and interactive surfaces consistent in both themes. They adapt automatically if the colour palette changes.

| Token | Value | Tailwind utility | Usage |
| --- | --- | --- | --- |
| `--shadow-surface` | `0 10px 30px rgba(0,0,0,0.12)` | `shadow-surface` | Base elevation for cards, panels, and sticky surfaces. |
| `--shadow-surface-hover` | `0 18px 40px rgba(0,0,0,0.16)` | `hover:shadow-surface-hover`, `focus-visible:shadow-surface-hover`, `group-hover:shadow-surface-hover` | Elevated state for interactive cards or hover/focus feedback. |

Default focus rings should continue to use Tailwind ring utilities; reserve the hover elevation for surfaces that already start at `shadow-surface`.

## Implementation notes

* The `.section` helper now applies `padding-block: var(--space-20)` to enforce section rhythm. For custom sections use the Tailwind utilities (`py-space-20`, `md:py-space-16`) instead of raw pixel values.
* Card shells (`.card`, `ProjectCard`) consume `--space-6` for padding, `--radius-xl` for corners, and the shared shadow tokens for elevation.
* The `.wrap` container and title stacks rely on the same spacing scale; reuse these tokens for any new horizontal gutters or headings.

Following these guidelines keeps spacing, elevation, and radii aligned across the marketing site, admin tools, and future sections without duplicating magic numbers.