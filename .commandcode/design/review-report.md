# ApexPad — Design Review

**Date:** 2026-08-05
**Scope:** Full interface surface (desktop dark, desktop light, mobile, all overlays)
**Register:** Product (instrument) — operate work pattern

## Executive summary

ApexPad is a mature, well-considered editor interface. The color system is the standout achievement: a whisper strategy in OKLCH with a violet-indigo accent, brand-tinted neutrals, and an authored (not inverted) dark mode. The motion system is tokenized and consistent. Typography is clean. The app does not look AI-generated — there is clear, deliberate intent behind every choice.

The design is **38/50**. Weaknesses cluster in three areas: hierarchy (a crowded header with seven icon buttons of equal weight, plus a disconnected floating `⌘K commands` button), typography (a flat type hierarchy where most UI text sits at 12–13px), and interaction polish (small tab-close hit targets, an inconsistent tool-list that bypasses the shared IconButton, and a diff viewer that is mislabeled).

**Next modes (by impact):**
1. `/design relayout` — restructure the header actions and reposition or redesign the floating command button.
2. `/design typeset` — strengthen type hierarchy in the header, tab bar, and footer.
3. `/design interaction` — fix tab-close touch targets, unify the tool-list buttons with IconButton, and audit focus management.

---

## Heuristic scores

| # | Lens | Score | Evidence |
|---|------|-------|----------|
| 1 | First impression | 9/10 | Near-black canvas with violet-indigo accent is distinctive and not generic. Geometric "A" monogram is purposeful. Dark mode is authored, not inverted. Clean, focused, clearly a text editor. |
| 2 | Hierarchy | 7/10 | Editor is clearly primary. But the header packs seven icon buttons with identical visual weight (no grouping of frequent vs. rare actions). The `⌘K commands` floating button is a disconnected afterthought with no custom focus ring. Save-status pill is well-placed. |
| 3 | Color voice | 9/10 | Whisper strategy executed in OKLCH. Violet-indigo accent (hue 262) is non-generic. Neutrals tinted chroma < 0.02. Dark mode uses lightness steps for depth; light mode uses layered shadows. State colors are semantic (green=save, amber=diff). |
| 4 | Type voice | 6/10 | Inter Variable + JetBrains Mono well chosen. Type scale defined (11/12/13/14/16/18/20px). But the UI is typographically flat — brand "ApexPad" at 13px, tab labels at 12px, footer stats at 11px. The 13px brand doesn't establish clear hierarchy over the 14px title field. |
| 5 | Interaction feel | 7/10 | Button/IconButton have full state coverage (hover, active scale, focus-visible, disabled, loading). IconButton enlarges hit area via ::before on coarse pointers. Dialog has focus trap + Escape + focus return. But tab-close button is tiny (p-1, 13px icon, no enlarged hit area). ToolDrawer list buttons bypass the shared IconButton component. The `⌘K commands` button has no active state. |
| | **Total** | **38/50** | |

### First impression

**Strengths:**
- The near-black canvas (`#0e0d14`) with violet-indigo accent is immediately recognizable and not generic SaaS cream-and-purple or dark-terminal-mono.
- The geometric "A" monogram is clean, works at favicon size, and uses solid accent fill (no gradient).
- The editor dominates the viewport — the interface immediately says "this is for writing."
- Dark mode is genuinely authored: surfaces get progressively lighter (0.135 → 0.168 → 0.208) rather than being light text on a dark background with flat gray.

**Weaknesses:**
- The overall composition is conventional (header → tabs → editor → footer). The visual distinctiveness comes from color, not layout. This is acceptable for a Product register but means the "point of view" is muted.

### Hierarchy

**Observed:**
- Editor (full height minus chrome) is unambiguously the primary element.
- Header (56px) provides context (logo, title, save status) and actions (7 icon buttons).
- Tab bar uses an accent border-top on the active tab — clear active state.
- Footer stats are de-emphasized at 11px mono.

**Issues:**
- **Header button soup:** Seven icon buttons (History, Tools, Share, Diff, Command Palette, Zen, Theme) sit in a tight row with identical visual weight. No grouping separates frequent actions (snapshot, tools) from rare ones (zen mode, theme toggle). The vision analysis confirmed "7 icons tightly packed."
- **Disconnected floating button:** The `⌘K commands` button is `fixed bottom-3 right-4 z-10` — an absolutely positioned afterthought with no focus ring of its own (relies on the base `:focus-visible` outline). It floats over content rather than living in the header or command palette.
- **Flat header type hierarchy:** "ApexPad" (13px, font-semibold) and "Untitled Note" title (14px, font-medium) have similar visual weight. There's no clear primary/secondary relationship.

### Color voice

**Strengths:**
- OKLCH whisper strategy is textbook: one violet-indigo accent carries all action, neutrals carry the surface.
- Brand-tinted neutrals (chroma < 0.02, hue 262) — grays have a violet cast that makes them feel authored, not empty.
- Dark mode depth comes from lightness steps, not shadows — this is the correct approach for dark UIs.
- Light mode uses layered neutral shadows — appropriate for the light register.
- State colors are semantic: `--success` for save status, `--warning` for diff highlighting, `--danger` for destructive actions.
- Colorblind safety: states are reinforced with text ("Saving…" / "Saved locally") and icons, not color alone.

**Issues:**
- None significant. The color system is the strongest aspect of the design.

### Type voice

**Strengths:**
- Inter Variable for UI, JetBrains Mono Variable for editor — appropriate pairing.
- Type scale is well-defined in Tailwind config: 11/12/13/14/16/18/20px with corresponding line heights.
- Tabular numerals on the stats footer is a thoughtful detail for changing numbers.
- Font feature settings (`cv11`, `ss01`) applied at the body level.

**Issues:**
- **Flat hierarchy:** Most UI text hovers around 12–14px. Body UI at 13px, tab labels at 12px, footer at 11px — the differences are marginal.
- **Brand text too small:** "ApexPad" at 13px (even with font-semibold) doesn't command primary attention. Linear and Notion use larger, bolder app names.
- **11px footer:** At the edge of readability. It passes WCAG AA contrast, but 11px is genuinely small for regular UI. Acceptable for metadata but worth reconsidering.
- The `lg` (16px) and `xl` (18px) size tokens defined in the config are unused in the current UI — the type scale isn't fully leveraged for hierarchy.

### Interaction feel

**Strengths:**
- Button component has full state coverage: hover, active (scale 0.98), focus-visible (ring), disabled (50% opacity), loading (spinner).
- IconButton uses a `::before` pseudo-element to expand the 32px visual hit area to 44px+ on coarse pointers — meets the quality gate.
- Dialog component is a single overlay shell with: backdrop blur + fade, panel scale/slide-in, Escape close, focus trap (Tab/Shift+Tab), and focus return to the opener.
- Motion is tokenized: 150ms baseline, 250ms modals, 300ms drawers, all using transform + opacity only.
- `prefers-reduced-motion` is honored (≤150ms, no spatial movement).
- Tab close uses the Escape key globally to close overlays — consistent affordance.

**Issues:**
- **Tab close hit target:** The close button is `p-1` with a 13px icon — no enlarged hit area. IconButton has the `::before` trick but the tab close button doesn't. On mobile this is hard to hit.
- **ToolDrawer list inconsistency:** The tool list buttons are plain `<button>` elements, not the shared `IconButton` component. They have hover states but lack the enlarged hit-area treatment and the `touch-manipulation` class. This is a code smell — fragmented implementation.
- **`⌘K commands` button:** No active state, no custom focus ring. Visually disconnected from the rest of the header.
- **Dialog backdrop close on mousedown:** The backdrop uses `onMouseDown` (not `onClick`) for closing. This means the dialog closes when the user presses the mouse button down, before they release — which can feel premature. The inner content uses `stopPropagation` on mousedown, which prevents the close. This is functional but slightly unusual.
- **Diff viewer mislabeling:** Titled "Latest snapshot diff" but it's a parallel line-by-line comparison, not a proper diff. Changed lines show `-`/`+` markers, but matching lines aren't aligned — there's no diff algorithm running. If the snapshot and current content have different lengths, the comparison shifts. This is a UX mismatch.
- **CommandPalette focus management:** Uses a custom `returnFocusRef` pattern rather than the Dialog component's built-in focus trap. This is intentional (the palette needs the trigger reference) but means there are two focus-management patterns in the codebase.

---

## Smell check

**Pass — does not read as AI-generated.** The design has clear intentionality:
- The violet-indigo accent is a deliberate non-generic choice (not blue-violet CTA or cyan gradient).
- Dark mode is authored with lightness steps, not inverted.
- Motion is tokenized and purposeful (not "motion on everything").
- The geometric monogram is bespoke, not a stock icon.

**Minor tells:**
- The `⌘K commands` floating button is a classic "AI afterthought" pattern — a help button bolted onto the corner with no integration.
- The header's seven equally-weighted buttons suggest "all actions treated as equal priority" — a common pattern when hierarchy isn't considered.
- The fake diff viewer suggests a feature implemented without full consideration of the user's actual need.

---

## What's working

1. **Color system** — the whisper strategy, OKLCH tokenization, and brand-tinted neutrals are genuinely excellent. This is the kind of detail that separates products that feel expensive from those that feel generic.
2. **Dark mode depth** — surfaces get progressively lighter (0.135 → 0.168 → 0.208). This is the correct approach and looks polished.
3. **Motion system** — tokenized durations and easing, transform + opacity only, reduced-motion fallback. Consistent and purposeful.
4. **Dialog component** — a single reusable overlay shell with full focus management. All modals (snapshots, sharing, diff, tools, command palette) share it.
5. **Responsive behavior** — tabs scroll horizontally on mobile, footer stats collapse to essential info, the `⌘K commands` button stays reachable.
6. **Editor theming** — CodeMirror themes are token-matched to the design system (dark and light).
7. **Accessibility foundation** — focus-visible ring, touch target enlargement, reduced-motion support, axe-scanned WCAG AA.

---

## Priority issues

### P0: Header action hierarchy

**Evidence:** Seven icon buttons in the header (History, Tools, Share, Diff, Command Palette, Zen, Theme) sit in a tight row with identical visual weight. No grouping distinguishes frequent actions from rare ones. Vision analysis: "7 icons tightly packed."

**Impact:** Cognitive load on every interaction. The user must visually process all seven every time they look at the header. Frequently-used actions (snapshot, tools, share, diff) compete visually with mode toggles (zen, theme).

**Fix:** `/design relayout` — group actions into logical clusters (e.g., content actions vs. view controls), or move less-frequent actions (zen, theme) behind a single "more" menu.

### P1: Diff viewer is not a real diff

**Evidence:** `DiffViewer.tsx` (line 9) takes the latest snapshot content and current content, splits both into lines, and renders them in parallel. It does not run a diff algorithm — matching lines aren't aligned, and if line counts differ, every subsequent line shifts and shows as "changed." The dialog title is "Latest snapshot diff" (line 19), which sets the expectation of a real diff.

**Impact:** Misleading. Users expect a diff viewer to align matching lines and highlight only actual changes. A parallel comparison that shifts on any insertion/deletion is confusing.

**Fix:** `/design redesign` — either implement a proper diff algorithm (or use a library) that aligns matching lines, or rename the feature to "Snapshot comparison" to accurately describe what it does.

### P1: Tab close button is a touch-target risk

**Evidence:** `TabBar.tsx` line 24: close button is `ml-2 rounded p-1` with a 13px `<X />` icon. No `::before` hit-area expansion (unlike `IconButton` which has `before:absolute before:-inset-1.5 before:rounded-lg`).

**Impact:** On mobile, the close button is well below the 44px minimum. Users will mis-tap.

**Fix:** `/design interaction` — apply the same hit-area enlargement pattern used by IconButton, or use IconButton for the tab close.

### P2: ToolDrawer bypasses shared IconButton

**Evidence:** `ToolDrawer.tsx` lines 25–32: tool list items are plain `<button>` elements with manual hover/focus classes, not the shared `IconButton` component. They lack the `::before` hit-area expansion, `touch-manipulation` class, and `active:scale-95` treatment.

**Impact:** Inconsistent interaction patterns. On coarse pointers, these buttons don't get the enlarged hit area that IconButton provides.

**Fix:** `/design interaction` — use the shared `IconButton` component or apply the same hit-area treatment.

### P2: `⌘K commands` floating button is disconnected

**Evidence:** `App.tsx` line 56: `<button className="fixed bottom-3 right-4 z-10 ...">⌘K commands</button>`. No focus ring of its own (relies on base CSS outline). No active state. Positioned as an absolute overlay, not integrated into the header or command palette.

**Impact:** Looks bolted-on. On small screens it overlaps content. It duplicates the command-palette affordance already in the header (Terminal icon button).

**Fix:** `/design relayout` — either remove it (the header already has a command palette button) or integrate it more intentionally.

### P2: Type hierarchy is flat

**Evidence:** Brand "ApexPad" is 13px font-semibold (Header.tsx line 38). Tab labels are 12px (TabBar.tsx). Footer stats are 11px (EditorCanvas.tsx line 39). The 16px and 18px type scale tokens are defined in `tailwind.config.js` but unused in the UI.

**Impact:** No clear visual hierarchy in the header. The brand name doesn't command attention over the document title.

**Fix:** `/design typeset` — use larger type for the brand name, establish clearer primary/secondary/tertiary relationships.

---

## Cognitive load / risk signals

**PASS:**
- Single overlay shell (Dialog) reused across all modals — reduces cognitive load.
- Consistent icon set (Lucide) throughout.
- Focus management: Escape closes all overlays, focus returns to opener.
- Save debounce is 500ms with clear visual feedback ("Saving…" → "Saved locally").
- Tab state persists in IndexedDB — no data loss on reload.
- Zen mode cleanly hides header + tab bar for distraction-free writing.

**WATCH:**
- Header has 7 actions with equal visual weight — consider grouping.
- `⌘K commands` button duplicates the command palette affordance already in the header.
- 11px footer text is at the edge of readability.
- Tab close hit area is below 44px minimum on mobile.

**FAIL:**
- Tool list buttons bypass the shared IconButton component — inconsistent hit areas.
- Diff viewer is mislabeled as a "diff" when it does parallel line comparison without alignment.

---

## Next modes

| Mode | What it addresses | Priority |
|------|-------------------|----------|
| `/design relayout` | Header action grouping, `⌘K commands` button placement | P0 |
| `/design typeset` | Flat type hierarchy in header and tabs | P2 |
| `/design interaction` | Tab close hit target, tool list button consistency, command button states | P1 |
| `/design redesign` | Diff viewer — implement real diff or rename | P1 |
| `/design finish` | Final polish pass after the above interventions | Follow-up |
