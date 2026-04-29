# DealDesk — Design Tokens

**Direction:** Heritage estate. Burgundy, brass, parchment.
**Status:** Canonical. All UI must reference these tokens. No hex codes, no font names anywhere else in the codebase.

---

## 1. Philosophy

DealDesk's brand evokes the visual language of traditional UK property — Savills, Knight Frank, Strutt & Parker. Parchment cream backgrounds, deep claret as the strong-contrast colour, antique brass as the primary accent, Instrument Serif for headlines with italic claret emphasis. Mono kicker labels above sections (the editorial pattern from the planning docs). Sage green and honey amber for verdict states, with claret-tinted backgrounds for failures.

Three editorial moves protect the brand identity from being sanded off into generic SaaS:

1. **Italic claret accents** in serif headlines (`...worth a *second look*`)
2. **Mono kicker labels** above section headings (`04 / DASHBOARD`)
3. **Parchment-on-claret** top bar — the heritage masthead

Heritage is **light-mode-first**. The primary expression of the brand is on parchment. A dark mode is provided for user preference and accessibility, but marketing screenshots and the default experience are light.

---

## 2. Colour palette

### Light mode (default)

```css
:root {
  /* Page surfaces */
  --bg-page: #f4ecd8;        /* parchment — the page background */
  --bg-surface: #fdfaf3;     /* warm white — cards, inputs, panels */
  --bg-surface-2: #f8f0db;   /* nested surfaces (callouts, code blocks) */
  --bg-strong: #5b2330;      /* claret — top bar, primary buttons, dark accents */

  /* Text */
  --text-primary: #1a1410;   /* deep brown-black — headlines, body */
  --text-secondary: #6b5e4d; /* warm brown — labels, metadata */
  --text-tertiary: #8a7d6b;  /* faded brown — hints, disabled, timestamps */
  --text-on-strong: #f4ecd8; /* parchment — text on claret surfaces */
  --text-accent: #5b2330;    /* claret — italic emphasis in headlines */

  /* Borders & rules */
  --border-default: #d9c8a3; /* parchment edge — most borders */
  --border-strong: #c4af7d;  /* darker parchment — emphasised borders, dividers */
  --border-focus: #b8901f;   /* brass — focus rings on inputs */

  /* Brand accent — antique brass */
  --accent: #b8901f;
  --accent-hover: #9c7818;
  --accent-pressed: #856518;
  --accent-soft: #f0e0a8;
  --accent-on: #1a1410;

  /* Semantic — verdict states (brief §09) */
  --pass-bg: #d6e3cf;
  --pass-fg: #2d4a36;
  --pass-border: #5b7553;

  --marginal-bg: #f0d99e;
  --marginal-fg: #6e4914;
  --marginal-border: #b8901f;

  --fail-bg: #efd2cb;
  --fail-fg: #5b2330;
  --fail-border: #8a3441;

  --info-bg: #d8dee8;
  --info-fg: #2c4055;
  --info-border: #4a6580;
}
```

### Dark mode

```css
.dark {
  --bg-page: #1f0e13;
  --bg-surface: #2a131a;
  --bg-surface-2: #341822;
  --bg-strong: #f4ecd8;

  --text-primary: #f4ecd8;
  --text-secondary: rgba(244, 236, 216, 0.72);
  --text-tertiary: rgba(244, 236, 216, 0.48);
  --text-on-strong: #1a1410;
  --text-accent: #efc77a;

  --border-default: rgba(244, 236, 216, 0.10);
  --border-strong: rgba(244, 236, 216, 0.18);
  --border-focus: #d4a942;

  --accent: #d4a942;
  --accent-hover: #e3bb5a;
  --accent-pressed: #b8901f;
  --accent-soft: rgba(212, 169, 66, 0.18);
  --accent-on: #1a1410;

  --pass-bg: rgba(91, 117, 83, 0.22);
  --pass-fg: #c5d4bc;
  --pass-border: #5b7553;

  --marginal-bg: rgba(184, 144, 31, 0.20);
  --marginal-fg: #f0d99e;
  --marginal-border: #b8901f;

  --fail-bg: rgba(138, 52, 65, 0.22);
  --fail-fg: #efd2cb;
  --fail-border: #8a3441;

  --info-bg: rgba(74, 101, 128, 0.22);
  --info-fg: #b3c5d0;
  --info-border: #4a6580;
}
```

Implementation: put both blocks in `app/globals.css`. Toggle dark mode by adding `class="dark"` to `<html>` (use `next-themes`).

---

## 3. Typography

```css
--font-serif: 'Instrument Serif', ui-serif, Georgia, serif;
--font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Geist Mono', ui-monospace, monospace;
```

Load via `next/font` in `app/layout.tsx`.

| Token         | Size              | Weight | Family | Use                                                                      |
| ------------- | ----------------- | ------ | ------ | ------------------------------------------------------------------------ |
| `text-display` | 48px / line 1.05  | 400    | serif  | Marketing hero only                                                      |
| `text-h1`      | 32px / line 1.05  | 400    | serif  | Page titles                                                              |
| `text-h2`      | 24px / line 1.15  | 400    | serif  | Section headings                                                         |
| `text-h3`      | 18px / line 1.3   | 500    | sans   | Card titles                                                              |
| `text-body`    | 15px / line 1.55  | 400    | sans   | Default body                                                             |
| `text-body-sm` | 13px / line 1.5   | 400    | sans   | Compact UI, tables                                                       |
| `text-label`   | 12px / line 1.4   | 500    | sans   | Form labels                                                              |
| `text-kicker`  | 11px / line 1.4   | 500    | mono   | Kicker labels — uppercase, letter-spacing 0.18em, brass colour           |
| `text-stat`    | 28px / line 1     | 400    | serif  | KPI numbers — heritage signature                                         |
| `text-mono-sm` | 11px / line 1.4   | 400    | mono   | IDs, technical metadata                                                  |

**Italic claret emphasis:** in serif headlines, parts that say "_…worth a second look_" use `font-style: italic; color: var(--text-accent);`. Once per headline maximum.

---

## 4. Spacing & layout

```css
--space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
--space-4: 1rem;     --space-5: 1.25rem;  --space-6: 1.5rem;
--space-8: 2rem;     --space-12: 3rem;    --space-16: 4rem;

--radius-sm: 3px;
--radius-md: 4px;
--radius-lg: 6px;
--radius-xl: 8px;
--radius-full: 9999px;

--container-app: 1280px;
--container-marketing: 1100px;
--container-prose: 680px;
```

Heritage uses **tighter corner radii than typical SaaS** (3–8px). Sharper corners read as architectural and traditional. Avoid pill shapes except for status dots.

Mobile-first per brief §13: 360px width, no horizontal scroll, tap targets ≥ 44px.

---

## 5. Component primitives

### Button

```css
.btn-primary {
  background: var(--bg-strong);
  color: var(--text-on-strong);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  min-height: 40px;
}
.btn-primary:hover { background: #6b2a3a; }

.btn-accent {
  background: var(--accent);
  color: var(--accent-on);
  /* same sizing */
}
.btn-accent:hover { background: var(--accent-hover); }

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  border: 0.5px solid var(--border-strong);
}
```

**Use `btn-primary` (claret) as the default.** Use `btn-accent` (brass) only for the *one* most important call-to-action on a page. Never two brass buttons on the same screen.

### Card

```css
.card {
  background: var(--bg-surface);
  border: 0.5px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
}
```

### Input

```css
.input {
  background: var(--bg-surface);
  border: 0.5px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 14px;
  font-family: var(--font-sans);
  min-height: 40px;
}
.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
```

### KPI card

KPI numerals use **serif** — heritage signature. Sets DealDesk apart from generic dashboards.

```css
.kpi { /* uses .card */ }
.kpi-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}
.kpi-value {
  font-family: var(--font-serif);
  font-size: 28px;
  color: var(--text-primary);
}
.kpi-value.is-accent {
  color: var(--text-accent);
  font-style: italic;
}
```

### Verdict banner (deal analyzer — brief §09)

```css
.verdict {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  border-left: 3px solid;
  padding: var(--space-4) var(--space-5);
}
.verdict-pass     { background: var(--pass-bg); color: var(--pass-fg); border-left-color: var(--pass-border); }
.verdict-marginal { background: var(--marginal-bg); color: var(--marginal-fg); border-left-color: var(--marginal-border); }
.verdict-fail     { background: var(--fail-bg); color: var(--fail-fg); border-left-color: var(--fail-border); }
```

Left-border accent only — no rounded corner on the left.

### Pill / badge

```css
.pill {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.pill-pass     { background: var(--bg-strong); color: var(--text-on-strong); }
.pill-marginal { background: var(--marginal-bg); color: var(--marginal-fg); }
.pill-fail     { background: var(--fail-bg); color: var(--fail-fg); border: 0.5px solid var(--fail-border); }
.pill-source-rightmove { background: var(--info-bg); color: var(--info-fg); }
```

**Heritage signature: the pass pill uses claret + parchment**, not green — like a stamp on a Victorian property document.

### Top bar

```css
.topbar {
  background: var(--bg-strong);
  color: var(--text-on-strong);
  padding: 14px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brand-deal { font-family: var(--font-serif); font-size: 22px; color: var(--text-on-strong); }
.brand-desk { font-family: var(--font-serif); font-size: 22px; color: var(--accent); font-style: italic; }
.topbar nav a {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(244, 236, 216, 0.7);
}
.topbar nav a.active { color: var(--accent); }
```

---

## 6. Tailwind setup (v4)

This project uses Tailwind CSS v4. Rather than `tailwind.config.ts`, configuration lives in `app/globals.css` via `@theme inline`. The CSS variables in section 2 are bridged so they generate Tailwind utility classes (`bg-bg-page`, `text-text-primary`, `border-border`, `bg-accent`, `text-pass-fg`, etc.).

---

## 7. shadcn/ui customisation

- `Button` — primary uses `bg-bg-strong text-text-on-strong`. Accent uses `bg-accent text-accent-on`.
- `Card` — `bg-bg-surface border-border rounded-lg`
- `Input` — `bg-bg-surface border-border focus:border-border-focus`
- `Badge` — custom variants: `pass`, `marginal`, `fail`, `source` per pill spec
- `Alert` — custom variants matching verdict banner spec

When adding new shadcn components, immediately swap `bg-background`/`text-foreground` to DealDesk tokens.

---

## 8. Marketing vs app

Same tokens, different volume.

**Marketing pages:** `--container-marketing` (1100px). Heavier serif. More italic claret accents. Mono kicker labels above each section. Long claret-on-parchment hero blocks. Like a Knight Frank property report.

**App pages:** `--container-app` (1280px). Serif for h1, KPI numerals, verdict banner headline only. Sans for everything else. Mono for postcodes, IDs, kicker labels, pill badges. Claret reserved for top bar, primary buttons, the pass pill — don't sprinkle elsewhere.

---

## 9. Accessibility — non-negotiable

- All text/background combos must clear WCAG AA (4.5:1 body, 3:1 large text).
- **Brass accent (`#b8901f`) on parchment (`#f4ecd8`) passes only for large text (≥18px), not 14px body.** Brass is for buttons (deep brown text on brass — high contrast), kicker labels, and heading accents — never body copy.
- Tap targets ≥ 44px.
- Focus rings always visible.
- Verdict states never colour-only — always include text label (`Pass`, `Marginal`, `Fail`).

---

## 10. What NOT to do

- ✗ No gradients
- ✗ No shadows on cards. Borders only
- ✗ No drop shadows behind type, no glow, no neon
- ✗ No emoji in UI chrome — Lucide icons only
- ✗ No hardcoded hex codes outside this file
- ✗ No serif on body or interactive elements. Serif is for headlines, KPI numerals, verdict banner only
- ✗ No font weight above 500
- ✗ No fintech colours (electric green, indigo) — claret-and-brass only
- ✗ No pill shapes for buttons or cards. Pills only for status badges
- ✗ No more than one brass button per screen
