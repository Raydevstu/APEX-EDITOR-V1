# ApexPad Implementation Standards and Architecture

## 1. Scope and product intent

ApexPad is an offline-first browser notepad designed for fast, private, local editing. The first release prioritizes multi-tab editing, resilient local persistence, focused editor workflows, lightweight text utilities, snapshots, encrypted local sharing, diff inspection, and installable PWA packaging.

Out of scope for the current release unless separately approved: server accounts, cloud synchronization, collaborative editing, server-side storage, analytics, remote content indexing, and recovery of data from a backend.

## 2. Technology baseline

| Area | Standard | Current implementation |
|---|---|---|
| Runtime | Browser, modern evergreen versions | Vite-generated browser app |
| UI | React + TypeScript | React 19 + TypeScript |
| Build | Vite | Vite 8 |
| Package manager | pnpm | pnpm 11 |
| State | Zustand | `src/store/useEditorStore.ts` |
| Persistence | IndexedDB | `idb-keyval` |
| Editor | CodeMirror | `@uiw/react-codemirror` and CodeMirror language packages |
| Styling | Tailwind CSS | Tailwind 3 configuration driven by design tokens in `src/theme/tokens.css`; see `docs/06-design-system.md` |
| Icons | Lucide | `lucide-react` |
| Fonts | Bundled variable fonts | Inter Variable (UI) + JetBrains Mono Variable (editor) via `@fontsource-variable/*` |
| Background processing | Web Worker | `src/workers/processor.worker.ts` |
| PWA | Vite PWA plugin | Generated service worker and manifest |
| Unit testing | Vitest | `src/**/*.test.ts` |
| E2E testing | Playwright | `e2e/` and `playwright.config.ts` |

## 3. Architecture

### Application shell

`src/App.tsx` composes the header, tab bar, editor canvas, tool drawer, snapshot modal, share modal, diff viewer, and command palette. The shell owns transient UI visibility while the editor store owns document state.

### State model

The store contains:

- `tabs`: ordered editable tab records.
- `activeTabId`: selected tab identifier.
- `theme`: dark or light (persisted to `localStorage['apexpad-theme']`, applied as a `.dark` class on `<html>` before first paint).
- `isZenMode`: chrome visibility state (independent of theme).
- `snapshots`: bounded local snapshot history.
- `isSaving`: debounced persistence indicator.
- `isCommandPaletteOpen`: command surface visibility.

The persisted tab envelope is versioned:

```ts
interface PersistedTabsState {
  version: 1
  tabs: Tab[]
  activeTabId: string
}
```

Each tab has an `id`, `title`, `content`, and `updatedAt`. Snapshots are associated with a tab and include title, content, timestamp, and identifier.

### Persistence rules

- Tab state is saved to IndexedDB key `apex_tabs_state`.
- Writes are debounced by 500 ms.
- Snapshot state is saved to `apex_snapshots`.
- Existing legacy content from `apex_active_doc` is migrated into the first tab.
- Invalid persisted tab entries are filtered.
- If the saved active tab is missing, the first valid tab becomes active.
- Closing the final tab creates a replacement untitled tab.

### Worker processing

Text transformations are dispatched through `workerManager.ts` to `processor.worker.ts`. Supported operations are:

- Format JSON.
- Strip surrounding whitespace and blank lines.
- Remove duplicate lines.
- Normalize CSV cell spacing.

Worker failures are returned to the drawer and do not silently replace content.

### Security model

Encrypted sharing uses browser Web Crypto AES-GCM with a generated 256-bit key and random 12-byte IV. The generated share value contains the encrypted payload and key for transfer. The application does not send data to a server or persist the generated share value.

Security limitations for the current release:

- The user is responsible for protecting the generated share string.
- There is no server-side revocation.
- There is no identity, access control, audit trail, or key escrow.
- Encryption round-trip tests and browser verification are still required before release approval.

## 4. Engineering rules

- Keep editor state in the Zustand store; do not duplicate canonical document state in components.
- Keep transient modal/drawer visibility local to `App` unless global access is required.
- Keep text transformations pure in `textTools.ts` so they can be unit tested independently of workers.
- Use semantic labels and accessible names for interactive controls.
- Preserve offline behavior: no feature may require a network request for core editing.
- Never claim persistence, encryption, offline support, or browser compatibility without a corresponding test or verification record.
- Update the progress register and QA record with every feature change.

## 5. Required development commands

```powershell
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm preview --host 127.0.0.1
```

## 6. Known build consideration

The production bundle currently emits a CodeMirror-related chunk above Vite's 500 kB advisory threshold. This is not a build failure, but production optimization should consider code splitting or lazy loading before a performance-sensitive release.
