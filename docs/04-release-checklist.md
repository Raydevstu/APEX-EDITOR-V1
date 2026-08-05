# ApexPad Release and Delivery Checklist

**Release candidate:** V1 (release-gate close, 2026-08-05)  
**Reviewer:** Engineering (automated + documented manual passes)  
**Review date:** 2026-08-05  
**Decision:** ☒ Go  ☐ Conditional go  ☐ No-go

## 1. Source and dependency readiness

- [x] Repository has no unintended generated or temporary files.
- [x] `pnpm install` succeeds from a clean checkout.
- [x] Lockfile is present and reviewed.
- [x] Runtime and package-manager versions are documented.
- [x] No secrets, tokens, or private content are committed.
- [x] Dependency licenses and security review are complete.

## 2. Functional acceptance

- [x] A new note can be created.
- [x] Multiple notes can be created and switched.
- [x] The active note remains selected after reload.
- [x] Closing an inactive tab leaves the active tab unchanged.
- [x] Closing the active tab selects the nearest valid tab.
- [x] Closing the final tab creates a replacement note.
- [x] Titles and content persist after reload.
- [x] Markdown and JSON content receive the intended editor language behavior.
- [x] Theme and Zen controls work without losing document content.
- [x] Text tools transform content and report invalid input safely.
- [x] Snapshots can be created, listed, restored, and compared.
- [x] Command palette opens with `Ctrl/Cmd+K`, supports Escape, and invokes actions.
- [x] Encrypted share output is generated without a network request.
- [x] Share output can be decrypted by the supported import path.

## 3. Data integrity and recovery

- [x] IndexedDB state is written after edits.
- [x] State survives normal reload.
- [x] Invalid persisted records are ignored safely.
- [x] Missing active-tab identifiers recover to a valid tab.
- [x] Legacy active-document data migrates correctly.
- [x] Snapshot cap behavior is verified.
- [x] Snapshot ordering, corrupted persistence, and legacy migration are verified by unit tests.
- [x] Empty documents do not create misleading snapshots.
- [x] Storage failure behavior is documented and tested.

## 4. Security and privacy

- [x] No editor content is sent to a remote service.
- [x] AES-GCM uses a fresh IV per encryption operation.
- [x] Decryption rejects modified payloads.
- [x] Share strings are not persisted automatically.
- [x] Clipboard use is user initiated.
- [x] Security limitations are visible in the handoff documentation.

## 5. Quality and accessibility

- [x] Unit tests pass.
- [x] E2E tests pass in supported Chromium for covered flows.
- [x] Keyboard-only navigation is usable.
- [x] Dialogs have accessible names and modal semantics.
- [x] Buttons and inputs have accessible labels.
- [x] Modal keyboard focus is contained and restored for covered flows.
- [x] Contrast meets the project accessibility target.
- [x] Desktop and mobile-sized layouts have no clipping or horizontal overflow.
- [x] Large documents remain usable.
- [x] Axe WCAG A/AA scan reports no serious/critical violations (main surface and command palette open).
- [x] Axe WCAG A/AA scan reports no serious/critical violations with every dialog open (tools, snapshots, share, diff) in dark mode.
- [x] Axe WCAG A/AA scan reports no serious/critical violations in light mode (main surface + share modal).
- [x] CodeMirror editor has an accessible name ("Note editor").

## 6. PWA and offline

- [x] Production build emits the service worker.
- [x] Manifest contains application name, colors, display mode, and icons.
- [x] App can be installed in a supported browser.
- [x] App shell reloads while offline after first visit.
- [x] Existing IndexedDB documents remain available offline.
- [x] Service worker registers with the configured auto-update lifecycle.
- [x] PWA icons render correctly at declared sizes.

## 7. Delivery evidence

- [x] Build command and output recorded.
- [x] Lint command and output recorded.
- [x] Unit test report attached or recorded.
- [x] E2E report attached or recorded.
- [x] Browser/version matrix recorded.
- [x] Known issues and accepted risks approved.
- [x] Handoff owner and support owner assigned.
- [x] Release decision signed by engineering and product owners.
