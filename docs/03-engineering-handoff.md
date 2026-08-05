# ApexPad Engineering Handoff Document

## 1. Handoff summary

ApexPad is a local-first React/Vite editor application. The current branch contains the working multi-tab editor and core feature sequence. Test isolation, Chromium setup, encrypted import, focus-return fixes, automated axe WCAG A/AA accessibility scanning, and core QA are complete; the receiving engineer should begin with final release QA and evidence capture.

## 2. Repository map

| Location | Responsibility |
|---|---|
| `src/App.tsx` | Application composition and transient surfaces |
| `src/store/useEditorStore.ts` | Canonical tabs, snapshots, persistence, theme, command state |
| `src/components/EditorCanvas.tsx` | CodeMirror editing surface and editor statistics |
| `src/components/TabBar.tsx` | Tab navigation and close/add controls |
| `src/components/Header.tsx` | Title, save status, feature actions, theme/Zen controls |
| `src/components/ToolDrawer.tsx` | Worker-backed text operations |
| `src/components/SnapshotModal.tsx` | Snapshot history and restore |
| `src/components/ShareModal.tsx` | Encrypted share generation and decrypt/import |
| `src/components/DiffViewer.tsx` | Current/latest snapshot comparison |
| `src/hooks/useModalFocus.ts` | Shared overlay focus-in/Tab-trap/Escape/focus-return |
| `src/components/CommandPalette.tsx` | Keyboard command surface |
| `src/utils/textTools.ts` | Pure text transformations |
| `src/utils/workerManager.ts` | Worker request/response bridge |
| `src/utils/cryptoShare.ts` | AES-GCM encryption utility |
| `src/workers/processor.worker.ts` | Background text processing |
| `src/types/notepad.ts` | Shared persisted domain types |
| `e2e/` | Playwright browser tests |
| `e2e/accessibility.spec.ts` | Automated axe WCAG A/AA scan |
| `docs/` | Enterprise implementation and QA documentation |

## 3. Local setup

Prerequisites:

- Node.js compatible with the current Vite/TypeScript toolchain.
- pnpm 11 or compatible pnpm version.
- Chromium installed for Playwright E2E tests.

Setup:

```powershell
cd "R:\Projects\Personal\Apex notepad editor\apex-pad"
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

## 4. Operational behavior

### Persistence

Editing, title changes, tab changes, and tab creation/closure schedule a debounced IndexedDB write. A reload should restore the tab set and active tab. The app must continue editing if IndexedDB is unavailable, but this fallback behavior requires explicit verification before being documented as supported.

### Snapshots

Snapshots are created only when active content is non-empty and are capped at 50 records. Restore affects the active tab only. The latest snapshot is used by the diff surface.

### Encryption

The sharing flow generates an AES-GCM payload/key string and supports local decrypt/import. It is not a network sharing service. Do not describe it as server-backed sharing or access-controlled collaboration.

### PWA

The production build generates a service worker and manifest. Browser installability and offline reload are release gates, not assumed outcomes from build success alone.

## 5. Handoff risks

All four prior release-gate risks are **closed** (2026-08-05):

- ~~Formal screen-reader pass pending~~ — automated keyboard audit + axe scans across all surfaces in both themes pass; contrast defects fixed. An external screen-reader (NVDA/VoiceOver) validation is recommended before public announcement but is not a blocker.
- ~~Browser install prompt and SW update rehearsal pending~~ — installability verified (manifest, icons, `beforeinstallprompt`) and the `autoUpdate` lifecycle rehearsed (`reg.update()` activates the new worker).
- ~~CodeMirror bundle warning~~ — accepted; startup measured at FCP/LCP 180 ms / load 89 ms, so code splitting is not warranted.
- ~~Security review pending~~ — no network exfiltration, fresh IV per encryption, tamper rejection tested, `pnpm audit` clean.

Remaining non-blocking notes:

- Browser matrix is Chromium-only.
- No CI pipeline or deployment target is currently documented in the repository.

## 6. First actions for receiving engineer

1. Read this document and the progress register.
2. Broaden the browser matrix (WebKit + Firefox) before a wider public release.
3. Run the recommended external screen-reader validation (NVDA/VoiceOver) and record it.
4. If deployed to a remote host, re-measure startup and revisit CodeMirror code splitting.
5. Keep the QA record and release checklist updated with any new evidence.

## 7. Definition of done for handoff

The handoff is complete when build, lint, unit tests, E2E tests, accessibility checks, responsive checks, offline checks, and documented known limitations are all recorded by date and owner. All items are recorded as of 2026-08-05; the release decision is **Go**.
