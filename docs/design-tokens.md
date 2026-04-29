# DealDesk — Design Tokens

Direction: Option B — Editorial brand evolved for app context.
Status: Canonical. All UI must reference these tokens. No hex codes, no font names anywhere else in the codebase.

## 1. Philosophy

DealDesk's brand evolves the editorial design system from the planning docs into something app-native. Cream backgrounds remain — they signal calm, considered, premium — but lighten so cards and inputs pop. Instrument Serif anchors hero moments (page titles, verdict headlines, marketing pages) but everything functional uses Geist sans for legibility. Ochre brightens into proper button territory. Moss-deep stays as the strong-contrast brand colour.

Three editorial moves protect the brand identity from being sanded off into generic SaaS:

- Italic ochre accents in serif headlines (`...worth a *second look*`)
- Mono kicker labels above section headings (`04 / dashboard`)
- Sage/rust verdict tints instead of stock fintech green/red

## 2. Colour palette

### Light mode (default)

```css
:root {
  /* Page surfaces */
  --bg-page: #fbf9f3;        /* lifted cream — the page background */
  --bg-surface: #ffffff;     /* cards, inputs, panels */
  --bg-surface-2: #fffdf8;   /* nested surfaces (callouts, code blocks) */
  --bg-strong: #1c3020;      /* moss-deep — top bar, primary buttons, dark accents */

  /* Text */
  --text-primary: #0e1b14;   /* headlines, body */
  --text-secondary: #5a6259; /* labels, metadata */
  --text-tertiary: #7a7061;  /* hints, disabled, muted timestamps */
  --text-on-strong: #f6f2ea; /* text on moss-deep surfaces */
  --text-accent: #2d4a36;    /* moss — italic emphasis in headlines */

  /* Borders & rules */
  --border-default: #ebe3d1; /* warm rule — most borders */
  --border-strong: #d9d1c1;  /* emphasised borders, dividers */
  --border-focus: #d9a23c;   /* focus rings on inputs */

  /* Brand accent */
  --accent: #d9a23c;         /* primary ochre — buttons, links, focus */
  --accent-hover: #c08e2c;
  --accent-pressed: #a87a23;
  --accent-soft: #f6e6c1;    /* tinted backgrounds (notification dots, soft chips) */
  --accent-on: #1c3020;      /* text on accent buttons (moss on ochre — high contrast) */

  /* Semantic — verdict states from brief §09 */
  --pass-bg: #e0ecdf;
  --pass-fg: #1c3020;
  --pass-border: #6a8a6c;

  --marginal-bg: #f9ebd0;
  --marginal-fg: #6e4914;
  --marginal-border: #c49a3a;

  --fail-bg: #f5dad0;
  --fail-fg: #6e2e1a;
  --fail-border: #a6432a;

  /* Info / system */
  --info-bg: #e3ecf1;
  --info-fg: #234555;
  --info-border: #3e5c6e;
}
```

### Dark mode

```css
.dark {
  --bg-page: #0f1714;
  --bg-surface: #1c2620;
  --bg-surface-2: #243029;
  --bg-strong: #0a1310;

  --text-primary: #f6f2ea;
  --text-secondary: rgba(246, 242, 234, 0.72);
  --text-tertiary: rgba(246, 242, 234, 0.45);
  --text-on-strong: #f6f2ea;
  --text-accent: #b8d4bc;

  --border-default: rgba(246, 242, 234, 0.10);
  --border-strong: rgba(246, 242, 234, 0.18);
  --border-focus: #e8b554;

  --accent: #e8b554;
  --accent-hover: #f0c46d;
  --accent-pressed: #d9a23c;
  --accent-soft: rgba(232, 181, 84, 0.15);
  --accent-on: #0e1b14;

  --pass-bg: rgba(106, 138, 108, 0.20);
  --pass-fg: #b8d4bc;
  --pass-border: #6a8a6c;

  --marginal-bg: rgba(196, 154, 58, 0.20);
  --marginal-fg: #f0d8a6;
  --marginal-border: #c49a3a;

  --fail-bg: rgba(166, 67, 42, 0.20);
  --fail-fg: #f0c7ba;
  --fail-border: #a6432a;

  --info-bg: rgba(62, 92, 110, 0.25);
  --info-fg: #b3c5d0;
  --info-border: #3e5c6e;
}
```

Implementation: put the `:root` and `.dark` blocks in `app/globals.css`. Toggle dark mode by adding `class="dark"` to `<html>` (use `next-themes` library).

## 3. Typography

### Font families

```css
--font-serif: 'Instrument Serif', ui-serif, Georgia, serif;
--font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Geist Mono', ui-monospace, monospace;
```

Load via `next/font` in `app/layout.tsx` using Google Fonts adapter for Instrument Serif, Geist, and JetBrains Mono. Assign each to a CSS variable per Next.js 15 conventions.

### Scale

| Token         | Size                   | Weight | Family | Use                                                                          |
| ------------- | ---------------------- | ------ | ------ | ---------------------------------------------------------------------------- |
| `text-display` | 48px / line 1.05      | 400    | serif  | Marketing hero only                                                          |
| `text-h1`      | 32px / line 1.08      | 400    | serif  | Page titles (dashboard, deal verdict)                                        |
| `text-h2`      | 24px / line 1.15      | 400    | serif  | Section headings                                                             |
| `text-h3`      | 18px / line 1.3       | 500    | sans   | Card titles, subsection headings                                             |
| `text-body`    | 15px / line 1.55      | 400    | sans   | Default body                                                                 |
| `text-body-sm` | 13px / line 1.5       | 400    | sans   | Compact UI, table cells                                                      |
| `text-label`   | 12px / line 1.4       | 500    | sans   | Form labels, metadata                                                        |
| `text-kicker`  | 11px / line 1.4       | 500    | mono   | Above-headline labels (`04 / DASHBOARD`) — uppercase, letter-spacing 0.18em  |
| `text-stat`    | 28px / line 1         | 400    | serif  | KPI numbers on cards                                                         |
| `text-mono-sm` | 11px / line 1.4       | 400    | mono   | Code, IDs, technical metadata                                                |

**Editorial italic emphasis:** in any serif headline, parts that say "…worth a _second look_" or "…what we're _building_" use `font-style: italic; color: var(--text-accent);`. Do this sparingly — once per headline maximum.

## 4. Spacing & layout

```css
/* Spacing scale (rem) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* Border radius */
--radius-sm: 4px;     /* badges, chips, small pills */
--radius-md: 6px;     /* inputs, buttons */
--radius-lg: 8px;     /* cards, panels */
--radius-xl: 12px;    /* hero/marketing surfaces */
--radius-full: 9999px;

/* Containers */
--container-app: 1280px;       /* dashboard max width */
--container-marketing: 1100px; /* marketing pages */
--container-prose: 680px;      /* docs, settings, narrow forms */
```

Mobile-first. Brief §13 acceptance criteria: all core pages work cleanly at 360px width, no horizontal scroll, all tap targets ≥ 44px.

## 5. Component primitives

These are the canonical specs. shadcn/ui components must be customised to match.

### Button

```css
.btn-primary {
  background: var(--accent);
  color: var(--accent-on);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  min-height: 40px;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:active { background: var(--accent-pressed); }

.btn-secondary {
  background: var(--bg-strong);
  color: var(--text-on-strong);
  /* same sizing as primary */
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  border: 0.5px solid var(--border-strong);
  /* same sizing */
}
```

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

```css
.kpi {
  background: var(--bg-surface);
  border: 0.5px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
}
.kpi-label { /* text-label tokens, color: var(--text-tertiary) */ }
.kpi-value { /* text-stat tokens, color: var(--text-primary) */ }
```

### Verdict banner (deal analyzer — brief §09)

Three states. Same shape, different palette.

```css
.verdict-pass {
  background: var(--pass-bg);
  color: var(--pass-fg);
  border-left: 3px solid var(--pass-border);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: var(--space-4) var(--space-5);
}
.verdict-marginal { /* same shape with --marginal-* */ }
.verdict-fail { /* same shape with --fail-* */ }
```

**Important:** verdict banners use a left border accent only — the brief says no rounded corner on the left. The CSS variable `border-radius: 0 ... ... 0` handles this.

### Pill / badge

```css
.pill {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.04em;
}
.pill-pass { background: var(--pass-bg); color: var(--pass-fg); }
.pill-marginal { background: var(--marginal-bg); color: var(--marginal-fg); }
.pill-fail { background: var(--fail-bg); color: var(--fail-fg); }
.pill-source-rightmove { background: var(--info-bg); color: var(--info-fg); }
```

### Top bar (app chrome)

White background, 0.5px bottom border, 56px tall, 22px horizontal padding. Logo wordmark on the left (`DealDesk` in sans 500, with a 24px moss-deep square containing italic serif `D` in ochre to its left). Nav links on the right at 13px sans, secondary colour, with the active route in primary at weight 500.

## 6. Tailwind setup (v4)

This project uses Tailwind CSS v4. Rather than `tailwind.config.ts`, configuration goes in `app/globals.css` via the `@theme` directive. The CSS variables in section 2 are wrapped in a matching `@theme inline` block so they generate Tailwind utility classes (`bg-bg-page`, `text-text-primary`, `border-border`, `bg-accent`, `text-pass-fg`, etc.).

## 7. shadcn/ui customisation

Update `components/ui/*.tsx` to use the tokens above. Specifically:

- **Button** → primary variant uses `bg-accent text-accent-on hover:bg-accent-hover`
- **Card** → `bg-bg-surface border-border` with `rounded-lg`
- **Input** → `bg-bg-surface border-border focus:border-border-focus`
- **Badge** → custom variants: `pass`, `marginal`, `fail`, `source`
- **Alert** → custom variants matching the verdict banner spec

When adding new shadcn components, immediately swap `bg-background`/`text-foreground` etc. to the DealDesk tokens before merging.

## 8. Marketing vs app

The same tokens cover both contexts; only emphasis changes.

**Marketing pages** (`/`, `/pricing`, `/about`):

- Use `--container-marketing` (1100px)
- Heavier serif: `text-display` for heroes, `text-h1` and `text-h2` for sections
- More italic ochre accents in headlines
- Mono kicker labels above each section (the editorial pattern from the planning docs)

**App pages** (`/dashboard`, `/watchlist`, `/deal/[id]`, `/settings`):

- Use `--container-app` (1280px) but pages can be narrower
- Serif only for page-level `h1` and the verdict banner headline
- Sans for everything else (cards, tables, forms, KPI labels)
- Mono only for technical metadata (postcodes, IDs, percentages where compactness matters)

The result: marketing feels like a Financial Times property column. The app feels like considered software. Same brand, different volume.

## 9. Accessibility — non-negotiable

- All text on background combinations must clear **WCAG AA** (4.5:1 body, 3:1 large text). The palette above is designed to pass — don't introduce off-token colours that don't.
- Tap targets ≥ 44px (brief §13).
- Focus rings always visible — never `outline: none` without an alternative.
- Verdict states never communicated by colour alone — always include a text label (Pass, Marginal, Fail).

## 10. What NOT to do

- ❌ No gradients (the brand is flat by design).
- ❌ No shadows on cards. Borders only.
- ❌ No drop shadows behind type, no glow, no neon.
- ❌ No emoji in UI chrome. Use Lucide icons (already in shadcn/ui).
- ❌ No hardcoded hex codes outside this file. Always reference tokens.
- ❌ No serif fonts for body or interactive elements (clickable text). Serif is for headlines and the verdict banner only.
- ❌ No font weight above 500. Stick to 400 and 500.
- ❌ No "stock fintech" colours (electric green, indigo, etc.) — this brand is sage-and-ochre, not Robinhood.
