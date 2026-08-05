# 06 — ApexPad Design System

Status: **Complete** (verified 2026-08-05). Tokenized design system meeting the quality bar of Linear / Notion / Obsidian and Apple-platform fit-and-finish, in both dark and light modes.

## Principles

- **Whisper color strategy** — one accent (refined violet-indigo) carries action; neutrals carry the surface. The accent stays rare enough to mean something.
- **OKLCH color space** — calibrated to human vision; neutrals tinted toward the brand hue (chroma < 0.02) so grays feel authored, not empty.
- **Depth from lightness in dark mode, from shadow in light mode** — dark mode is authored, not inverted.
- **Motion = character** — transform + opacity only; tokenized durations and easing; `prefers-reduced-motion` fades everything to 150ms.
- **Contrast is material** — every text token passes WCAG AA 4.5:1 on its surface (axe-scanned).

## Tokens

Source of truth: `src/theme/tokens.css` (CSS custom properties) → mapped into Tailwind via `tailwind.config.js`.

### Color roles

| Token | Dark | Light | Use |
|---|---|---|---|
| `--canvas` | near-black `#0e0d14` | warm near-white | page background |
| `--surface` | raised panel | panel | header, tab active, cards |
| `--surface-raised` | higher | higher | tooltips, popovers |
| `--hairline` | subtle light | subtle dark | dividers, borders |
| `--border` | visible border | visible border | input/panel borders |
| `--text-primary` | ~`#f5f3fb` | ~`#3a3743` | primary content |
| `--text-secondary` | light gray | mid gray | secondary UI |
| `--text-muted` | mid gray | darker gray | metadata, captions |
| `--accent` | violet `oklch(0.54 0.16 270)` | violet `oklch(0.55 0.18 262)` | primary actions, active states, focus, cursor |
| `--accent-soft` | translucent violet | translucent violet | active icon backgrounds |
| `--success` | green | green | save status, success states |
| `--warning` | amber | amber | diff highlight |
| `--danger` | red | red | destructive actions |
| `--focus-ring` | accent | accent | 2px focus-visible outline |

### Elevation

- `--shadow-sm` / `--shadow-md` / `--shadow-lg` — dark mode uses light-tinted near-black shadows; light mode uses layered neutral shadows.

### Motion tokens

| Token | Value | Use |
|---|---|---|
| `--dur-100` | 100ms | tactile feedback |
| `--dur-150` | 150ms | hover, focus, press |
| `--dur-200` | 200ms | success flash, small reveals |
| `--dur-250` | 250ms | menus, small modals |
| `--dur-300` | 300ms | drawers, layout changes |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | decelerate (quart expo-out) |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | subtle overshoot |

### Typography

- **Inter Variable** (bundled via `@fontsource-variable/inter`) — app UI.
- **JetBrains Mono Variable** (bundled) — editor, code, stats footer.
- System fallback stack keeps SF Pro on Apple devices.
- Type scale: 11/12/13/14/16/18/20px with tabular numerals for the stats footer.

## Components (`src/ui/`)

| Component | States | Notes |
|---|---|---|
| `Button` | primary/secondary/ghost/danger × sm/md, hover, active (scale 0.98), focus-visible, disabled, loading | primary accent used sparingly |
| `IconButton` | sm/md, hover, active (scale 0.95), focus-visible, active-tint | 32px visual, ≥44px hit area on coarse pointers |
| `Dialog` | center/right/top placement, backdrop blur + fade, panel scale/slide-in, Escape close, focus trap + focus return | single shell for all overlays |
| `Logo` | — | geometric "A" monogram, solid accent, no gradient |

## Theming model

- `ThemeMode = 'light' | 'dark'` (zen is now a **separate** chrome-visibility flag, not a palette).
- `.dark` class on `<html>`; token CSS switches automatically.
- Persisted in `localStorage` key `apexpad-theme`; applied before first paint in `main.tsx` (no FOUC).
- `color-scheme: light dark` so native form controls match.

## Motion behavior

- Dialog: backdrop fade (200ms) + panel scale 0.96→1 (250ms, expo-out).
- ToolDrawer: slide-in from right edge (300ms).
- CommandPalette: slide-in-up (250ms).
- Buttons/icon buttons: active scale 0.95–0.98.
- Save-status pill: crossfade on state change.
- All animations use `transform` + `opacity` only.
- `prefers-reduced-motion: reduce` → everything ≤150ms, no spatial movement.

## Brand assets

- `public/logo.svg` — master mark (dark canvas, accent tile, monogram).
- Generated PNGs: `pwa-192.png`, `pwa-512.png` (any + maskable), `apple-touch-icon.png` (180), `favicon-32.png`.
- `favicon.svg` — crisp tab icon.
- Regenerate with `node scripts/generate-icons.mjs`.

## Accessibility

- All text tokens pass WCAG AA 4.5:1 (verified by axe in e2e — main surface and command palette clean).
- Focus-visible ring: 2px, 2px offset, accent (never `outline: none` without replacement).
- Touch targets ≥44px on coarse pointers.
- Reduced-motion honored.
- Overlays: `role="dialog"`, `aria-modal`, labelled heading, focus trap + focus return, Escape close.

## Light mode

- Warm near-white canvas, violet-tinted hairlines, layered neutral shadows, same accent.
- CodeMirror gets a dedicated light theme (`src/editor/apexTheme.ts`).
- Theme toggle now switches the **whole app**, not just the editor.

## Verification evidence

- `pnpm lint` — 0 warnings, 0 errors.
- `pnpm test` — 24/24 unit tests pass.
- `pnpm build` — production build succeeds (main bundle ~870 kB / 291 kB gzip).
- `pnpm test:e2e` — 24/24 pass including axe WCAG A/AA scans across every dialog in both themes, keyboard accessibility audit, and PWA installability.
- Contrast: all text tokens pass WCAG AA 4.5:1 on their surfaces in both themes (axe-verified). Note the dark/light accents were deepened so white button text clears AA, and the `text-onAccent` utility class (camelCase) is the one Tailwind generates — kebab-case variants are ignored.
- Startup (production preview): FCP/LCP 180 ms, load 89 ms.
