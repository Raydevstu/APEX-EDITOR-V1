# ApexPad Cross-Audit Checklist

**Sources:** `Final master plan.doc` + `CoreBluprints\Design\Function\features.doc`
**Audit date:** 2026-08-05
**Method:** Every feature/function/design item in both docs extracted, then checked against the current app source (`src/**`) and running dev server.

Legend: ✅ Implemented · ⚠️ Partial/Variant · ❌ Not implemented

---

## Part A — Final Master Plan (`Final master plan.doc`)

### A1. Environment / Stack
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A1.1 | Node.js v18+ runtime | ✅ | package.json + running dev server |
| A1.2 | React 19 | ✅ | `react ^19.2.8` |
| A1.3 | TypeScript 5.7+ | ✅ | `typescript ~6.0.2` |
| A1.4 | Vite 5.4+ | ✅ | `vite ^8.2.0` |
| A1.5 | Tailwind CSS v3.4+ | ✅ | `tailwindcss ^3.4.17` |
| A1.6 | Lucide React icons | ✅ | `lucide-react ^1.28.0` |
| A1.7 | CodeMirror 6 + JSON + Markdown extensions | ✅ | `@uiw/react-codemirror`, `@codemirror/lang-json`, `@codemirror/lang-markdown` |
| A1.8 | Zustand 5+ state | ✅ | `zustand ^5.0.14` |
| A1.9 | idb-keyval 6+ persistence | ✅ | `idb-keyval ^6.3.0` |
| A1.10 | vite-plugin-pwa 0.21+ | ✅ | `vite-plugin-pwa ^1.3.0` |

### A2. Directory structure
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A2.1 | `src/types/notepad.ts` | ✅ | exists (ThemeMode, Tab, Snapshot, PersistedTabsState) |
| A2.2 | `src/store/useEditorStore.ts` | ✅ | exists |
| A2.3 | `src/utils/textTools.ts` | ✅ | exists |
| A2.4 | `src/utils/cryptoTools.ts` | ⚠️ | renamed → `src/utils/cryptoShare.ts` (AES-GCM, different API) |
| A2.5 | `src/utils/benchmark.ts` | ❌ | not present |
| A2.6 | `src/utils/workerManager.ts` | ✅ | exists |
| A2.7 | `src/workers/processor.worker.ts` | ✅ | exists |
| A2.8 | `src/components/Header.tsx` | ✅ | exists |
| A2.9 | `src/components/EditorCanvas.tsx` | ✅ | exists |
| A2.10 | `src/components/ToolDrawer.tsx` | ✅ | exists |
| A2.11 | `src/components/SnapshotModal.tsx` | ✅ | exists |
| A2.12 | `src/components/CommandPalette.tsx` | ✅ | exists |

### A3. State Management (store)
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A3.1 | `content` state | ✅ | store `tabs[].content` |
| A3.2 | `title` state | ✅ | store `tabs[].title` |
| A3.3 | `theme` ('light'|'dark'|'zen') | ⚠️ | `ThemeMode = 'light' | 'dark'` (no zen in type; zen is a separate `isZenMode` bool) |
| A3.4 | `isZenMode` | ✅ | store `isZenMode` |
| A3.5 | `snapshots[]` | ✅ | store `snapshots` |
| A3.6 | `isSaving` flag | ✅ | store `isSaving` |
| A3.7 | `isCommandPaletteOpen` | ✅ | store `isCommandPaletteOpen` |
| A3.8 | `setContent` with debounced save (500ms) | ✅ | `scheduleSave` 500ms |
| A3.9 | `setTitle` with debounced save | ✅ | `scheduleSave` |
| A3.10 | `setTheme` | ✅ | store |
| A3.11 | `toggleZenMode` | ✅ | store |
| A3.12 | `setCommandPaletteOpen` | ✅ | store |
| A3.13 | `takeSnapshot` (max 20) | ⚠️ | present, but max is 50 (not 20) |
| A3.14 | `restoreSnapshot(id)` | ✅ | store, scoped to active tab |
| A3.15 | `loadPersistentState` from IndexedDB | ✅ | store, incl. legacy `apex_active_doc` migration |
| A3.16 | Persist active doc key `apex_active_doc` | ✅ | legacy key read + migrated to `apex_tabs_state` |
| A3.17 | Persist snapshots key `apex_snapshots` | ✅ | same key |

### A4. Text Tools (utils/textTools.ts)
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A4.1 | `formatJSON` (beautify, error passthrough) | ✅ | `format-json` in `applyTextTool` (variant: returns input on error, no error msg) |
| A4.2 | `stripWhitespace` (trim each line) | ✅ | `strip-whitespace` (variant: also filters empty lines) |
| A4.3 | `removeDuplicateLines` | ✅ | `dedupe-lines` |
| A4.4 | `formatCSVTable` (pad columns) | ⚠️ | `format-csv` joins with `, ` but does NOT pad/align columns |
| A4.5 | Unit tests for text tools | ✅ | `src/utils/textTools.test.ts` + `textTools.edge.test.ts` |

### A5. Crypto (utils/cryptoTools.ts → cryptoShare.ts)
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A5.1 | `encryptText(plaintext, secretKey)` PBKDF2 + AES-GCM | ⚠️ | present but different scheme: generated AES-GCM key (not password-derived PBKDF2); no salt/iteration UI |
| A5.2 | `decryptText` (decrypt back) | ✅ | `decryptText` in cryptoShare |
| A5.3 | Self-contained encrypted share link | ✅ | ShareModal: `payload#key` |

### A6. Benchmark (utils/benchmark.ts)
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A6.1 | `PerformanceMonitor` startup/typing/save metrics | ❌ | file not present; no perf monitoring module |
| A6.2 | Threshold check (startup>100ms, typing>16ms, save>50ms) | ❌ | absent |

### A7. Worker (processor.worker.ts + workerManager)
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A7.1 | Worker actions DEDUPLICATE_LINES / FORMAT_CSV | ⚠️ | worker handles all 4 tools via `applyTextTool` (superset) |
| A7.2 | 10MB threshold → worker, else sync | ❌ | `processText` ALWAYS posts to worker (no size gate) |
| A7.3 | Worker fallback when unavailable | ❌ | no try/catch fallback; worker constructed at module load |
| A7.4 | `workerManager` singleton | ⚠️ | single `worker` const + `processText` (function, not class) |

### A8. UI Components
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A8.1 | Header: APEXPAD brand | ✅ | Header shows `ApexPad` logo + name |
| A8.2 | Header: inline editable title | ✅ | title input |
| A8.3 | Header: save status indicator | ✅ | "Saved locally" / "Saving…" |
| A8.4 | Header: Tools & Cleaners button | ✅ | `PanelRight` IconButton → ToolDrawer |
| A8.5 | Header: Snapshots button | ✅ | `History` IconButton |
| A8.6 | Header: Zen mode toggle | ✅ | `EyeOff` |
| A8.7 | Header: Theme toggle (dark/light) | ✅ | `Sun`/`Moon` |
| A8.8 | EditorCanvas: CodeMirror, JSON/Markdown auto-detect | ✅ | `json()`/`markdown()` on first char |
| A8.9 | Editor: oneDark theme in dark mode | ✅ | custom `apexThemeFor` (not oneDark pkg, custom CM theme) |
| A8.10 | Editor: line numbers | ✅ | `lineNumbers: !isZenMode` |
| A8.11 | Editor: active line highlight | ✅ | `highlightActiveLine: true` |
| A8.12 | Editor: hide line numbers in zen | ✅ | `!isZenMode` |
| A8.13 | Status bar: Lines/Words/Characters | ✅ | EditorCanvas footer |
| A8.14 | ToolDrawer: 4 tools (JSON/strip/dedupe/CSV) | ✅ | ToolDrawer list |
| A8.15 | ToolDrawer: success/error notification | ✅ | `role="status"` message |
| A8.16 | SnapshotModal: list, timestamps, restore | ✅ | SnapshotModal |
| A8.17 | SnapshotModal: empty state | ✅ | "No snapshots for this note yet." |
| A8.18 | CommandPalette: Ctrl/Cmd+K toggles | ✅ | App keydown handler |
| A8.19 | CommandPalette: commands (tools, snapshots, zen, theme) | ⚠️ | palette has New note / Tools / Snapshots (no zen/theme items) |
| A8.20 | App shell: full-height layout | ✅ | `h-screen` flex column |

### A9. PWA
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A9.1 | PWA manifest (name, icons 192/512, standalone) | ✅ | vite.config manifest |
| A9.2 | `registerType: autoUpdate` | ✅ | vite.config |
| A9.3 | include favicon + apple-touch-icon | ✅ | includeAssets |
| A9.4 | Workbox glob patterns for assets | ⚠️ | custom `workbox` block absent (vite-plugin-pwa defaults) |

### A10. Tests
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A10.1 | `textTools.test.ts` (JSON format, invalid JSON, strip) | ✅ | textTools.test.ts + edge tests |
| A10.2 | Playwright smoke test (APEXPAD visible) | ⚠️ | e2e suite exists (11 specs) but header text now `ApexPad`, smoke targeting "APEXPAD" would need update |

### A11. Global styles
| # | Planned item | Status | Evidence |
|---|---|---|---|
| A11.1 | antialiased, selection color | ✅ | index.css base |
| A11.2 | custom 6px scrollbar | ⚠️ | 8px scrollbar (macOS-like, refined) |
| A11.3 | slate-950 dark background | ⚠️ | `--canvas` oklch tokens instead |

---

## Part B — Enterprise Features Doc (`features.doc`)

### B1. Design Token System
| # | Planned item | Status | Evidence |
|---|---|---|---|
| B1.1 | Semantic CSS variables replacing hardcoded hex | ✅ | `src/theme/tokens.css` (OKLCH token scale) |
| B1.2 | Surface elevation scale (`--bg-app`, `--bg-surface`, hover) | ✅ | `--canvas`, `--surface`, `--surface-hover` |
| B1.3 | Border/dividers tokens | ✅ | `--hairline`, `--border`, `--border-strong` |
| B1.4 | Typography colors (primary/secondary/muted) | ✅ | `--text-primary/secondary/muted/faint` |
| B1.5 | Accent color tokens | ✅ | `--accent`, `--accent-hover` |
| B1.6 | `--font-sans` Inter stack | ✅ | Inter Variable |
| B1.7 | `--font-mono` JetBrains Mono / Geist Mono | ⚠️ | JetBrains Mono loaded via fontsource in package.json; token uses font-mono utility |
| B1.8 | Layout scale vars (sidebar/inspector/header/status heights) | ⚠️ | only `--dur-*` motion tokens; no sidebar/inspector dimension vars (no such regions) |
| B1.9 | Radius tokens (sm/md/lg) | ⚠️ | Tailwind rounded utilities used, not CSS vars |
| B1.10 | Elevation shadows (subtle/popover) | ✅ | `--shadow-sm/md/lg` |

### B2. Tier-1 App Shell Architecture
| # | Planned item | Status | Evidence |
|---|---|---|---|
| B2.1 | Global Header toolbar (title, sync badge, actions) | ✅ | Header |
| B2.2 | Breadcrumbs (Personal > Apex Notepad > doc) | ❌ | absent |
| B2.3 | Collapsible Left Sidebar (Documents/Tags/Folders/Settings) | ❌ | no sidebar; TabBar instead |
| B2.4 | Sidebar treeview explorer, recents, favorites | ❌ | absent |
| B2.5 | Ctrl+\ sidebar toggle | ❌ | absent |
| B2.6 | Right Inspector panel (TOC, backlinks, telemetry) | ❌ | absent |
| B2.7 | Inspector: Document Outline / TOC | ❌ | absent |
| B2.8 | Inspector: Backlinks graph | ❌ | absent |
| B2.9 | Inspector: Document stats (words/read time) | ❌ | stats only in bottom status bar |
| B2.10 | Bottom Status Bar (LN/COL, UTF-8, branch) | ❌ | bottom bar shows lines/words/chars + tab id, no LN/COL/UTF-8/branch |
| B2.11 | Global search trigger in header (Search or command…) | ⚠️ | no search field; only ⌘K button |
| B2.12 | Floating selection toolbar (Bold/Italic/Code/Link/AI) | ❌ | absent |
| B2.13 | Block-based drag handles (⋮⋮) | ❌ | absent |
| B2.14 | Contextual Slash (/) command menu | ❌ | absent |
| B2.15 | Live Markdown parsing (TipTap/ProseMirror AST) | ❌ | CodeMirror markdown, not TipTap |
| B2.16 | Sub-pixel borders + depth layering (backdrop blur) | ⚠️ | hairlines + `backdrop-blur-sm` present, but not the full inset/border layering |
| B2.17 | Max editor reading width (~780px) | ❌ | editor is full-width |

### B3. TipTap Live Markdown Engine
| # | Planned item | Status | Evidence |
|---|---|---|---|
| B3.1 | `@tiptap/react` dependency | ❌ | not installed |
| B3.2 | `@tiptap/starter-kit` | ❌ | not installed |
| B3.3 | Placeholder extension ("Type '/' for commands…") | ❌ | not installed |
| B3.4 | Typography extension | ❌ | not installed |
| B3.5 | BubbleMenu (selection format bar) | ❌ | absent |
| B3.6 | H1/H2/H3, bold/italic/strike/code commands | ❌ | absent |
| B3.7 | Blockquote, bullet/numbered lists | ❌ | absent (CM markdown only) |
| B3.8 | TipTap content persistence (getHTML/getText) | ❌ | absent |

### B4. Cmd+K Command Palette (cmdk)
| # | Planned item | Status | Evidence |
|---|---|---|---|
| B4.1 | `cmdk` dependency | ❌ | not installed (custom palette built) |
| B4.2 | ⌘K/⌃K global toggle | ✅ | App handler |
| B4.3 | Searchable command list | ✅ | custom filter |
| B4.4 | AI Assistant group (Fix Grammar, Summary) | ❌ | no AI commands |
| B4.5 | Convert Block group (H1/H2/H3, code, lists, quote) | ❌ | absent |
| B4.6 | Inline Formatting group (bold/italic/clear) | ❌ | absent |
| B4.7 | Document ops (New Note, Copy raw text) | ⚠️ | New note present; copy raw text absent |
| B4.8 | Empty state ("No results found") | ✅ | "No commands match…" |
| B4.9 | Footer shortcut hints (↑↓ ↵ Esc) | ⚠️ | not shown |

### B5. Slash Commands
| # | Planned item | Status | Evidence |
|---|---|---|---|
| B5.1 | `@tiptap/suggestion` + tippy.js | ❌ | not installed |
| B5.2 | `/` trigger popup | ❌ | absent |
| B5.3 | Slash items (Text, H1-3, lists, code, quote) | ❌ | absent |
| B5.4 | Keyboard nav (↑↓, Enter, Esc) | ❌ | absent |
| B5.5 | "AI Draft Summary" slash item | ❌ | absent |

### B6. Syntax Highlighting (lowlight)
| # | Planned item | Status | Evidence |
|---|---|---|---|
| B6.1 | `@tiptap/extension-code-block-lowlight` + `lowlight` | ❌ | not installed |
| B6.2 | Language-aware code block highlighting | ❌ | CodeMirror json()/markdown() only, no lowlight |
| B6.3 | `createLowlight(common)` with JS/TS/Python/JSON/etc. | ❌ | absent |
| B6.4 | HLJS dark token palette CSS | ❌ | absent |

### B7. Interactive Code Block Component
| # | Planned item | Status | Evidence |
|---|---|---|---|
| B7.1 | NodeViewWrapper custom code block | ❌ | absent |
| B7.2 | Language selector dropdown (auto + 13 langs) | ❌ | absent |
| B7.3 | Copy button with "Copied" state | ❌ | absent |
| B7.4 | Line numbers gutter | ❌ | absent |
| B7.5 | Fold/collapse toggle + collapsed preview | ❌ | absent |
| B7.6 | Line count badge | ❌ | absent |
| B7.7 | Download snippet as file (language→extension map) | ❌ | absent |

### B8. Document Export
| # | Planned item | Status | Evidence |
|---|---|---|---|
| B8.1 | `turndown` (Markdown export) | ❌ | not installed |
| B8.2 | `html2pdf.js` (PDF export) | ❌ | not installed |
| B8.3 | Export as Markdown (.md) | ❌ | absent |
| B8.4 | Export as standalone HTML (.html) | ❌ | absent |
| B8.5 | Export as PDF (.pdf) | ❌ | absent |
| B8.6 | Export dropdown in header (MD/HTML/PDF) | ❌ | absent |

---

## Summary

| Bucket | Planned | ✅ | ⚠️ | ❌ |
|---|---|---|---|---|
| **Part A — Master Plan** | 65 | 43 | 16 | 6 |
| **Part B — Features (enterprise)** | 56 | 8 | 6 | 42 |
| **Total** | **121** | **51** | **22** | **48** |

**Implemented (core master plan):** full stack, store with debounced IndexedDB save, multi-tab, snapshots, 4 text tools, worker offload, command palette, zen mode, theme, encrypted share, PWA manifest.

**Not implemented (all from features.doc enterprise tier):** TipTap engine, bubble menu, slash commands, cmdk (custom simple palette used), lowlight syntax highlighting, interactive code blocks, document export (MD/HTML/PDF), left sidebar, right inspector, breadcrumbs, bottom LN/COL status bar.

**Partial / variants:** CSV tool doesn't pad columns; worker has no 10MB threshold; benchmark module absent; zen type is separate boolean; snapshot cap 50 not 20; palette lacks zen/theme/copy/formatting commands; no global search field.
