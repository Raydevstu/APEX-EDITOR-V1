# ApexPad Design Brief

**Product:** ApexPad — offline-first, local-first multi-tab notepad editor. Runs entirely in the browser (IndexedDB, no server/account/cloud). PWA-installable.

**Register:** Product (instrument). The operator edits notes daily; the interface earns trust through consistency and speed.

**Work pattern:** Operate. The dominant job is direct manipulation of a canvas (the editor) with tabs, a command palette, a text-tools drawer, snapshot history, a diff viewer, and encrypted sharing as supporting surfaces.

**Direction (locked 2026-08-05):** Dark Linear-style first, with a first-class light mode. Reference quality bar: Linear, Notion, Obsidian, Apple platform UI.

## Visual language

- **Color:** Whisper strategy. Near-black / warm-near-white neutrals tinted toward the brand hue (OKLCH, chroma < 0.02). One violet-indigo accent (`oklch(0.58 0.18 262)` light / `0.64 0.17` dark) for primary actions, active states, focus, cursor. Success/warning/danger for state only.
- **Type:** Inter Variable for UI, JetBrains Mono Variable for the editor. System stack (SF Pro) as fallback on Apple devices.
- **Motion:** transform + opacity only. 150ms baseline, 250ms modals, 300ms drawers, expo-out deceleration. `prefers-reduced-motion` → ≤150ms fades. Spring feel via `--ease-spring`.
- **Surfaces:** hairline borders (violet-tinted), depth from surface lightness in dark / layered shadows in light. Rounded 6–20px radii. Backdrop blur on overlays.

## Tokens & system

- Source of truth: `src/theme/tokens.css` (CSS custom properties) → `tailwind.config.js`.
- Theme: `.dark` class on `<html>`, persisted to `localStorage['apexpad-theme']`, applied pre-paint (no FOUC).
- UI primitives in `src/ui/`: `Button`, `IconButton`, `Dialog` (center/right/top), `Logo`.
- CodeMirror themes in `src/editor/apexTheme.ts` (token-matched dark + light).

## Quality gates

- WCAG AA contrast everywhere (axe-scanned in e2e).
- Focus-visible 2px accent ring, never removed.
- Touch targets ≥44px on coarse pointers.
- No dead/orphaned template assets.
- Full pipeline green: lint, unit, build, e2e.

## What to avoid

- Indigo-to-violet gradients on CTAs, cyan-accent SaaS tropes, generic centered-card layouts.
- Motion on everything, page-load theater, layout-property animation (width/height).
- Display fonts in product labels, five grays, accent on cancel/secondary controls.
- `outline: none` without a replacement, hover-only affordances, sub-4.5:1 text.
