# Manga + Marvel Design Audit

> Authoritative reference for the visual language of (a) modern One Piece manga (Wano + Egghead arcs, 2022-2026) and (b) modern Marvel comics + MCU dossier style (Hickman/Aaron-era Avengers + MCU Phase 4-5, 2018-2026). Produced by `research-analyst` agent, May 2026.

---

## One Piece — Wano + Egghead Visual Language

### Hex Color Palette

| Swatch | Hex | Usage |
|---|---|---|
| Ink Black | `#1a0d05` | Panel borders, kanji SFX, outline strokes |
| Cream Page | `#fdf6e3` | Page/section background (newsprint simulation) |
| Aged Poster | `#e8c98c` | Wanted poster cards, callout boxes |
| Luffy Red | `#d11b1b` | Accents, error states, blood/danger beats |
| Gear 5 White | `#f5f0e8` | Hero mode background; near-white with warm paper undertone |
| Wano Teal | `#2a7c6f` | Zoro/samurai-era section borders, supporting accent |

Notes: Oda's official color spreads (One Piece Wiki Color Spreads, updated through 2024) use warm cream-to-amber paper fields, never pure `#ffffff`. Gear Fifth's official anime-confirmed palette (2023 Shonen Jump cover) is white hair + red eyes + blue/purple sash.

### Typography (no new npm deps — bunny.net hosted)

```html
<!-- index.html: replace existing Google Fonts <link> -->
<link rel="preconnect" href="https://fonts.bunny.net" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.bunny.net/css?family=noto-sans-jp:400,700,900|bangers:400|bebas-neue:400|special-elite:400&display=swap"
/>
```

```css
/* index.css */
--font-jp-sfx:  "Noto Sans JP", system-ui, sans-serif;   /* 900 for SFX */
--font-jp-body: "Noto Sans JP", system-ui, sans-serif;   /* 400 for captions */
```

- **Noto Sans JP 900** — all Japanese onomatopoeia (ドン, ゴゴゴ, バキ).
- **Noto Sans JP 400** — caption boxes, narrator text.
- **Bangers 400** (already loaded) — English SFX only.
- **Special Elite 400** (already loaded) — wanted-poster body copy.

### 8 Design Moves

1. **Panel borders:** `3px solid #1a0d05` outer + `1px solid #1a0d05` inner offset by `2px` via `box-shadow: inset 0 0 0 2px #fdf6e3, inset 0 0 0 4px #1a0d05`. Printed-press double-border without extra DOM.
2. **Screentone halftone overlay:** `background-image: radial-gradient(circle, #1a0d05 1px, transparent 1px)` at `background-size: 6px 6px`, `opacity: 0.07`. Apply as `::before` on section bg in manga mode — mimics ~18 LPI screen tone.
3. **Speed lines (radial burst):** `repeating-conic-gradient(transparent 0deg 29deg, #1a0d05 29deg 30deg)` on a `::after` pseudo centered on a focal point. 12 lines, 1.5px visual.
4. **SFX text treatment:** Japanese SFX in `var(--font-jp-sfx)`, `font-weight: 900`, `font-size: clamp(2rem, 8vw, 6rem)`, `-webkit-text-stroke: 2px #1a0d05`, `color: #fdf6e3`. English SFX uses Bangers + same stroke + `color: #d11b1b`.
5. **Wanted-poster card:** `background: #e8c98c`, `border: 3px solid #8b5e2a`, `font-family: "Special Elite"`, `box-shadow: 4px 4px 0 #1a0d05` (hard, no blur). Inner portrait area: `border: 2px solid #1a0d05`, `background: #fdf6e3`.
6. **Gear 5 mode flash:** On hero card hover, transition bg `#fdf6e3` → `#ffffff` over `0.15s ease-out` then back to `#f5f0e8` over `0.6s ease-in`. Pair with `filter: brightness(1.4) saturate(0)` on character image for 80ms — matches Toei's Egghead arc panel transition.
7. **Panel gutter:** Set CSS Grid `gap: 4px` between manga cards/panels, `background-color: #1a0d05` on the grid container. Gutters appear as thick ink separators — Oda's page gutters read as black, not white.
8. **Ink texture:** `background-blend-mode: multiply` + `noise` SVG data URI overlay. Opacity 0.04-0.06 adds paper grain without a network request.

### 5 Design DON'Ts

1. Never use `font-family: "Comic Sans"` or default `cursive` — manga SFX must use `Noto Sans JP 900` or `Bangers`.
2. Never render Japanese onomatopoeia as English transliterations (`POW!` instead of `バキ!`).
3. Never use `border-radius > 4px` on panel borders — manga panels are strictly rectangular.
4. Never use `linear-gradient` backgrounds where flat ink is authentic — wanted-poster bg must be flat `#e8c98c`.
5. Never use pure `#ffffff` for page backgrounds — use `#fdf6e3` or `#f5f0e8` to preserve newsprint feel.

---

## Marvel / MCU — Hickman Era + Phase 4-5 Dossier Visual Language

### Hex Color Palette

| Swatch | Hex | Usage |
|---|---|---|
| Asgard Rune Gold | `#c8a040` | Accent lines, Asgardian section borders, icon fills |
| Bifrost Cyan | `#76cfff` | `--color-highlight` (already in use), energy effects |
| Mjolnir Slate | `#4a5568` | Surface cards, dossier panel backgrounds |
| MCU Poster Teal | `#0a2540` | Hero section dark bg — Phase 4 cinematic teal-black |
| Marvel Blood Red | `#c8102e` | Marvel logo red, danger badges, active nav states |
| Dossier White | `#f0f2f5` | Data-page text fields, Muller-style infographic bg |

Notes: MCU Phase 4-5 one-sheets use teal-orange complementary contrast. Tom Muller's House of X system used pure primary accent colors on black/white data pages. The existing `--color-accent-2: 26 160 230` and `--color-highlight: 118 207 255` already match the Bifrost/Hickman blue family.

### Typography (no new fonts needed)

Current stack already covers it:

- **Bebas Neue** (`--font-cinematic`) — dossier headers, section labels, stat readouts.
- **Bangers** — comic SFX, battle callouts.
- **Special Elite** — classified/redacted dossier body copy (typewriter classification docs).
- **Saira Condensed 700** (optional 4th slot) — only add if Bebas proves too decorative for small UI text.

### 8 Design Moves

1. **Halftone dot overlay (Hickman-panel density):** `background-image: radial-gradient(circle, rgb(118 207 255 / 0.18) 1px, transparent 1px)` at `background-size: 7px 7px`. Apply as `::before` on Marvel-mode section cards. Matches Hickman Avengers data-page dot density.
2. **Dossier panel grid:** CSS Grid `gap: 5px`, `background: #0a2540`. Hickman uses rigid 5px white gutters; in dark mode, invert to 5px dark gutters.
3. **Data-page redaction bar:** `background: #c8102e`, `height: 2px`, `width: 100%`, `margin: 0.25rem 0`. Stack two via `::before`/`::after` above/below classified text. Muller's HoX style.
4. **Circle-mark accent (Hickman signature):** `border-radius: 50%`, `border: 2px solid #c8a040`, `8x8px` inline marker before section headings via `::before`. Hickman's universal story-break glyph.
5. **Cinematic letterbox:** Top + bottom `4vh` bars in `#0a2540` via padding on `<main>` in Marvel mode — simulates 2.39:1 anamorphic crop.
6. **Marvel stat badge:** `background: #c8102e`, `color: #f0f2f5`, `font-family: "Bebas Neue"`, `font-size: 0.75rem`, `letter-spacing: 0.1em`, `padding: 2px 6px`, `clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)` — Hickman's roster-infographic parallelogram.
7. **Hard shadow (no blur):** Marvel-mode cards: `box-shadow: 4px 4px 0 #c8102e` for active/hover. Idle: `box-shadow: 2px 2px 0 #4a5568`. Hickman's flat comic-print aesthetic.
8. **Accent line rule:** Section dividers: `3px solid #c8102e` above `1px solid #c8a040 (opacity 0.6)`, stacked `2px` apart. Hickman/Muller's universal Avengers chapter header separator.

### 5 Design DON'Ts

1. Never use `border-radius > 2px` on dossier cards — Hickman's grid is strictly rectilinear.
2. Never apply `drop-shadow` CSS filter for soft glows on text — use hard offset `text-shadow: 2px 2px 0 #c8102e` for comic-print feel.
3. Never use more than 2 accent colors simultaneously in one component.
4. Never use `font-style: italic` with `Bebas Neue` or `Bangers` — both are display-only uprights.
5. Never simulate "aged paper" in Marvel dossier mode — that texture belongs only to wanted-poster components.

---

## Top Priority Picks (apply first if budget-constrained)

**Top 3 One Piece:**
1. Grid `gap: 4px` + `background: #1a0d05` on container → instant manga gutter effect, zero markup cost.
2. Screentone halftone via `radial-gradient` pseudo at 6px grid, 7% opacity → paper texture, no image file.
3. Noto Sans JP 900 + `-webkit-text-stroke: 2px #1a0d05` for all Japanese SFX → makes manga mode feel authentic.

**Top 3 Marvel:**
1. Hard `box-shadow: 4px 4px 0 #c8102e` (zero blur) on card hover → Hickman's flat-ink aesthetic.
2. Stacked double-rule section dividers: `3px #c8102e` above `1px #c8a040` → Muller's chapter separator.
3. Halftone: `radial-gradient` dots at 7px grid, `rgb(118 207 255 / 0.18)` → Hickman Avengers data-page density.

---

## Sources

- [One Piece Egghead Art Style — Screen Rant](https://screenrant.com/one-piece-egghead-art-style-change-king-anime/)
- [One Piece Gear Fifth Official Colors — ComicBook.com](https://comicbook.com/anime/news/one-piece-gear-fifth-official-color-scheme/)
- [Tom Muller on Designing the Evolution of X — Marvel](https://www.marvel.com/articles/comics/tom-muller-designing-evolution-x-logo)
- [Inside House of X, Powers of X — SYFY Wire](https://www.syfy.com/syfy-wire/inside-house-of-x-powers-of-x-and-graphics-that-are-reshaping-the-mutant-world)
- [Building a Better Looking Future: Design in Comics — SKTCHD](https://sktchd.com/longform/building-a-better-looking-future-digging-into-the-increased-focus-on-design-in-comics/)
- [One Piece Animation Style Changes by Arc — AnimotionsStudio](https://animotionsstudio.com/animation-style-change-throughout-one-piece/)
- [Bunny Fonts — GDPR-friendly Google Fonts alternative](https://fonts.bunny.net/)
- [Noto Sans JP — Google Fonts](https://fonts.google.com/specimen/Noto+Sans+JP)
- [MCU Teal-Orange palette analysis — Filmora](https://filmora.wondershare.com/video-creative-tips/teal-orange-color-palette.html)
- [One Piece Color Walks — One Piece Wiki](https://onepiece.fandom.com/wiki/One_Piece_Color_Walks)
