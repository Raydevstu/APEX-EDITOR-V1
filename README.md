# ApexPad — Offline-First Multi-Tab Notepad Editor

**APEX-EDITOR V1**

ApexPad is a local-first, offline-capable notepad editor that runs entirely in your browser. Everything you type is stored on your device (IndexedDB) — there is no server, no account, and no cloud dependency.

It supports multiple tabs, markdown/JSON editing with syntax highlighting, text-processing tools (run in a background worker), snapshot history, a diff viewer, a command palette, and client-side encrypted sharing of a single note via a self-contained link.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Using ApexPad](#using-apexpad)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Data, privacy & offline](#data-privacy--offline)
- [Encrypted sharing](#encrypted-sharing)
- [PWA installation](#pwa-installation)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Features

| Feature | What it does |
|---|---|
| Multi-tab editing | Create, switch, and close notes in one window. Each tab has its own title, content, and save state. |
| Instant capture | Editor autofocuses on open so you can type immediately. `/?new=1` (and the PWA “New note” shortcut) opens a fresh note. |
| Automatic persistence | Changes debounce to IndexedDB (500ms) and mirror synchronously to localStorage; `pagehide` / tab-hide flushes pending writes. Content survives reloads and offline use. |
| Full-text search | Ctrl/Cmd+K searches note titles and bodies with instant results, snippets, and ↑/↓/Enter navigation (plus commands). |
| Markdown & JSON editing | CodeMirror 6 with syntax highlighting — switches to JSON mode automatically when the content looks like JSON. |
| Text tools | Format JSON, trim empty lines, dedupe lines, and align CSV columns — heavy work runs in a web worker off the main thread. |
| Snapshot history | Capture versions of a note and restore any of them. Capped at 50 snapshots total, listed per tab. |
| Diff viewer | Compare the active tab's latest snapshot against its current content, side-by-side with changed lines highlighted. |
| Command palette | Search notes and run quick actions (new note, open tools, open snapshots, AI) via Ctrl/Cmd+K. |
| AI assistant (opt-in) | Rewrite selection, summarize note, and ask your notes (answer + jump to sources) via SpaceXAI/xAI. Requires a user-provided API key; core editing stays offline. |
| Snip → text (OCR) | Capture/paste/upload a screenshot, crop the region, convert offline with Tesseract, edit, then insert into the note. Shortcut: Ctrl/Cmd+Shift+S. |
| Encrypted sharing | Generate a self-contained `payload#key` link with AES-GCM encryption and import a shared note back. |
| Zen mode | Hide the header and tab bar for distraction-free writing. |
| Light / dark themes | One-click toggle across the whole app (header, tabs, editor, overlays). |
| Design system | Tokenized OKLCH palette, bundled Inter + JetBrains Mono, custom brand mark and PWA icons, spring-like CSS motion with reduced-motion support. See `docs/06-design-system.md`. |
| PWA / offline | Installable app shell with a service worker — the app loads and works without a network connection. |

---

## Tech stack

- **React 19** + **TypeScript** + **Vite 8**
- **Zustand** — state management
- **CodeMirror 6** (`@uiw/react-codemirror`) — editor
- **Tailwind CSS 3** — styling
- **Lucide** — icons
- **idb-keyval** — IndexedDB persistence
- **vite-plugin-pwa** — offline support / service worker
- **Vitest** + **@testing-library/react** — unit tests
- **Playwright** + **@axe-core/playwright** — E2E and accessibility tests

---

## Prerequisites

- **Node.js 20.19+** (or 22.12+) — required by Vite 8.
- **pnpm** — all package operations use pnpm.

Install pnpm once if you don't have it:

```bash
npm install -g pnpm
```

---

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Start the development server (with hot reload)
pnpm dev
```

Open **http://localhost:5173** in your browser.

To stop the server, press **Ctrl+C** in the terminal that is running it.

> **Note:** the app persists data in your browser's IndexedDB. To see a clean slate, use a private/incognito window or clear site data.

---

## Available scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the Vite development server with hot module replacement. |
| `pnpm build` | Type-check (`tsc -b`) and produce a production build in `dist/`. |
| `pnpm preview` | Serve the production build locally (defaults to http://localhost:4173). Run `pnpm build` first. |
| `pnpm lint` | Run oxlint over the codebase. |
| `pnpm test` | Run the Vitest unit test suite once. |
| `pnpm test:e2e` | Run the Playwright E2E tests (requires `pnpm build` first; the config starts its own preview server). |
| `pnpm exec playwright install chromium` | Download the Chromium browser needed for E2E tests. |

**Typical release check:**

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

---

## Using ApexPad

### Notes (tabs)

- **Create a note** — click the **+ (New tab)** button in the tab bar, or press `Ctrl+T` / `Cmd+T`.
- **Switch notes** — click any tab in the tab bar.
- **Close a note** — click the **×** on a tab, or press `Ctrl+W` / `Cmd+W` to close the active tab. Closing the last tab automatically creates a fresh one.
- **Rename a note** — type in the title field in the header (labeled "Note title").
- Each tab keeps its own content, title, and snapshot history. Editing one tab never affects another.

### Editor

- The editor auto-detects content: if it starts with `{` or `[`, JSON syntax highlighting is enabled; otherwise Markdown highlighting is used.
- The status bar at the bottom shows live **Lines · Words · Characters** for the active tab, plus the tab's short ID.

### Header actions (left to right)

| Button | Action |
|---|---|
| APEXPAD brand | — |
| Title field | Rename the active note |
| Save status | "Saving..." / "Saved locally" |
| History icon | **Create snapshot** — capture the current state of the active note |
| Panel-right icon | **Text tools** — open the tool drawer |
| Share icon | **Encrypted sharing** — generate/import an encrypted link |
| Git-compare icon | **Compare latest snapshot** — open the diff viewer |
| Scissors icon | **Snip → text** — screenshot OCR (Ctrl/Cmd+Shift+S) |
| Sparkles icon | **AI assistant** — open “Ask your notes” (also available in ⌘K) |
| Terminal icon | **Command palette** — searchable quick actions |

### Snip → text

1. **Win+Shift+S** (or any screenshot to clipboard) → focus ApexPad → **Ctrl+V**, or open **Snip** from the header / ⌘K / **Ctrl+Shift+S**.
2. Optionally **drag a crop** around the text.
3. **Convert to text** (offline Tesseract OCR — first run may download the English language data).
4. Edit the result → **Insert into note** (snapshot taken first) or **Copy text**.

Also supports **Screen / window** capture (browser picker) and image upload / drag-drop. AI vision “Accurate” mode is planned later; Phase 1 is fast local OCR only.
| Eye-off icon | **Zen mode** — hide header and tab bar |
| Sun/Moon icon | **Toggle theme** — switch light/dark |

### AI assistant

AI is **optional** and never required for editing, search, or offline use.

1. Open **⌘K → AI settings…** (or run any AI command once).
2. Paste an [xAI API key](https://console.x.ai) (SpaceXAI / `https://api.x.ai/v1`). The key is stored only in this browser’s `localStorage`.
3. Use the palette:

| Command | What it does |
|---|---|
| **AI: Fix grammar / Make clearer / Make shorter / Professional tone** | Rewrites the current selection (or whole note). Review → **Replace in note** (auto-snapshot first). |
| **AI: Summarize note / Key points / Action items** | Summarizes the active note. **Insert below** as a markdown section. |
| **AI: Ask your notes…** | Question → grounded answer from FTS hits + clickable source notes. Shortcut: type `?your question` in ⌘K. |

Later you can point **Base URL** at a local OpenAI-compatible server (e.g. Ollama) without changing the app.

### Text tools

Open with the **Panel-right** button, or via the command palette (**Open text tools**).

| Tool | Description |
|---|---|
| Format JSON | Parse and pretty-print JSON (shows an error message for invalid JSON). |
| Trim empty lines | Remove empty lines from the document. |
| Dedupe lines | Remove duplicate lines, keeping the first occurrence. |
| Format CSV spacing | Align CSV columns into a readable plain-text table. |

- Results replace the active tab's content.
- Processing runs in a **web worker**, so the UI stays responsive even on large documents.
- A status line at the bottom reports "Runs off the main thread", "Applied successfully", or an error message.

### Snapshots

1. Click the **History** button in the header (or run **Create snapshot** from the command palette — if available).
2. The **Snapshot history** dialog lists snapshots for the *active* tab only.
3. Click **Restore** to replace the current content with that snapshot.
4. Close with the **×** button, **Escape**, or click the backdrop.

The oldest snapshots are pruned at 50 total. Only non-empty notes can be snapshotted.

### Diff viewer

1. Create a snapshot of a note.
2. Click the **Git-compare** button in the header.
3. The **Latest snapshot diff** dialog shows the snapshot (baseline) vs. the current content, line by line. Changed lines are highlighted in amber with `-` / `+` markers.
4. Close with **Escape** or the **×** button.

### Command palette & full-text search

- Open with **Ctrl+K** (Windows/Linux) or **Cmd+K** (macOS), the **Terminal** button, or the **⌘K commands** button at the bottom-right.
- Type to search **note titles and bodies** (instant results with snippets) and to filter commands: **New note**, **Open text tools**, **Open snapshots**.
- Use **↑ / ↓** to move, **Enter** to open a note or run a command; **Escape** closes the palette.
- Opening a note or **New note** focuses the editor for immediate typing.

### Zen mode & themes

- **Zen mode** hides the header and tab bar for a clean writing surface. Exit via the floating button at the top-right, or press `Escape`-accessible paths (the floating button is always visible).
- **Theme** toggles between dark (default) and light.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open search / command palette |
| `↑` / `↓` / `Enter` | Navigate and run palette results |
| `Ctrl+T` / `Cmd+T` | Create a new tab |
| `Ctrl+W` / `Cmd+W` | Close the active tab |
| `Escape` | Close any open dialog / palette |

---

## Data, privacy & offline

- **Storage:** all notes, titles, and snapshots live in your browser's **IndexedDB** under local keys (`apex_tabs_state`, `apex_snapshots`), with a synchronous localStorage crash mirror (`apex_tabs_crash`) so a hard reload mid-debounce keeps content. Nothing is uploaded anywhere.
- **Autosave:** changes debounce to IDB by 500 ms and flush immediately on tab hide / page unload; the header shows "Saving..." while a write is pending and "Saved locally" when it's done.
- **Instant capture:** the editor autofocuses on open. Visit `/?new=1` or use the installed PWA **New note** shortcut for a fresh tab.
- **Offline:** after the app has loaded once, the service worker caches the app shell. Reloading without a network still works, and your notes are read from IndexedDB.
- **Legacy migration:** a previous single-document record (`apex_active_doc`) is migrated into a tab automatically when no multi-tab state exists yet.
- Clearing browser site data deletes your notes — export anything important via encrypted sharing before doing so.

---

## Encrypted sharing

ApexPad shares notes **client-side only** — the "link" is a self-contained encrypted payload and nothing is ever sent to a server.

### Generate a link

1. Make sure the note you want to share is the active tab.
2. Click the **Share** button in the header.
3. Click **Generate encrypted link**.
4. The generated value looks like `payload#key` — copy it with the **Copy** button and send it to the recipient through any channel you trust.

The key travels *inside* the link and is never stored by ApexPad. Anyone with the link can decrypt it, so treat it like a password.

### Import a link

1. Open **Encrypted sharing**.
2. Paste the full `payload#key` value into **Import encrypted share**.
3. Click **Decrypt and import** — the decrypted content replaces the current tab's content.

Tampered, truncated, or invalid links show an error (`"That encrypted share is invalid or has been tampered with."`). If Web Crypto is unavailable, a clear error is shown instead.

> Links are self-contained, so very large notes produce very long links.

---

## PWA installation

ApexPad is a progressive web app with a service worker (auto-update mode) and a web manifest.

- **Install (desktop):** use your browser's install affordance — the address-bar install icon in Chrome/Edge, or **Install ApexPad** from the browser menu.
- **Install (mobile):** in Chrome, use **Add to Home screen** from the browser menu.
- **Offline:** the first visit registers the service worker; after that the app shell loads from cache even when offline.

To test offline behavior locally:

```bash
pnpm build
pnpm preview
```

Then open http://localhost:4173, load the app once, switch to **Offline** in DevTools → Network, and reload.

---

## Testing

### Unit tests (Vitest)

```bash
pnpm test
```

Covers text tools (including edge cases), CSV/JSON formatting, tab lifecycle, snapshot cap/order/restore, crypto round-trip and tamper detection, command filtering, and overlay accessibility behavior (focus, Escape, dialog semantics).

### E2E tests (Playwright)

```bash
pnpm exec playwright install chromium   # one time
pnpm build                              # E2E serves the production preview
pnpm test:e2e
```

Covers tab creation, mobile layout (390 px), offline shell + persistence recovery, PWA registration, snapshot create/compare/restore, command palette + text tools, encrypted share round-trip, modal Escape/focus-return, and automated axe WCAG A/AA scans.

---

## Accessibility

- All dialogs use `role="dialog"` with accessible names, `aria-modal`, Escape-to-close, focus trapping (Tab/Shift+Tab), and focus restoration to the opener on close.
- The editor, all icon buttons, inputs, and tab close buttons carry accessible labels.
- Contrast on all secondary text meets WCAG AA.
- An automated **axe** scan (WCAG A/AA, serious/critical only) runs as part of `pnpm test:e2e` on the main surface and with the command palette open.

---

## Project structure

```
apex-pad/
├── docs/                     # Implementation, QA, and handoff documentation
├── e2e/
│   ├── editor.spec.ts        # Browser flow tests
│   └── accessibility.spec.ts # Axe WCAG A/AA scans
├── public/                   # PWA icons and favicon
├── src/
│   ├── components/           # Header, TabBar, EditorCanvas, ToolDrawer,
│   │                         # SnapshotModal, ShareModal, DiffViewer, CommandPalette
│   ├── hooks/                # useModalFocus (shared overlay focus management)
│   ├── store/                # Zustand editor store + persistence
│   ├── types/                # Shared domain types
│   ├── utils/                # textTools, cryptoShare, workerManager
│   ├── workers/              # Background text-processing worker
│   ├── App.tsx               # App shell / coordination
│   └── main.tsx              # Entry point
├── index.html
├── package.json
├── vite.config.ts            # Vite + PWA config
├── vitest.config.ts
├── playwright.config.ts
└── tailwind.config.js
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `pnpm dev` won't start (port in use) | Stop the other process or use a different port. On Windows: `netstat -ano \| findstr :5173`, then `taskkill /PID <pid> /T /F`. |
| `pnpm test:e2e` fails with browser missing | Run `pnpm exec playwright install chromium`. |
| E2E tests look stale | `pnpm test:e2e` serves `dist/` — run `pnpm build` first. |
| Saved notes missing after a browser update | Clear site data for the app and reload; confirm you exported anything important via encrypted sharing. |
| `gh` / `git` not recognized | Open a new terminal (PATH change) or use the full install path (`C:\Program Files\GitHub CLI\gh.exe`, `C:\Program Files\Git\cmd\git.exe`). |

---

## Pieces MCP Setup for VS Code

If you use PiecesOS and want VS Code to access its Long-Term Memory via MCP, add a workspace MCP config.

### 1. Create or update `.vscode/mcp.json`

```json
{
  "servers": {
    "pieces": {
      "type": "http",
      "url": "http://localhost:39300/model_context_protocol/2025-03-26/mcp"
    }
  }
}
```

### 2. Start PiecesOS and verify MCP

- Ensure PiecesOS is running.
- Open the PiecesOS Quick Menu and expand **Model Context Protocol (MCP) Servers**.
- Copy the current endpoint URL and confirm the port matches the active instance.
- If you need SSE legacy mode instead, use:

```json
{
  "servers": {
    "pieces": {
      "type": "sse",
      "url": "http://localhost:39300/model_context_protocol/2024-11-05/sse"
    }
  }
}
```

### 3. Use the MCP server in VS Code

- Install and activate an MCP-aware extension such as GitHub Copilot Chat.
- Run **MCP: List Servers** in the Command Palette to confirm `pieces` is connected.
- Use **MCP: Edit Server** if you need to update the `pieces` URL after PiecesOS restarts.

### 4. Notes

- VS Code expects the root key to be `servers`, not `mcpServers`.
- For Streamable HTTP, use `type: "http"`; for legacy SSE, use `type: "sse"`.
- Save `.vscode/mcp.json`; VS Code should pick up changes automatically.
