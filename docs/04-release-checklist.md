# ApexPad Release and Delivery Checklist

**Release candidate:** ______  
**Reviewer:** ______  
**Review date:** ______  
**Decision:** ☐ Go  ☐ Conditional go  ☐ No-go

## 1. Source and dependency readiness

- [ ] Repository has no unintended generated or temporary files.
- [ ] `pnpm install` succeeds from a clean checkout.
- [ ] Lockfile is present and reviewed.
- [ ] Runtime and package-manager versions are documented.
- [ ] No secrets, tokens, or private content are committed.
- [ ] Dependency licenses and security review are complete.

## 2. Functional acceptance

- [ ] A new note can be created.
- [ ] Multiple notes can be created and switched.
- [ ] The active note remains selected after reload.
- [ ] Closing an inactive tab leaves the active tab unchanged.
- [ ] Closing the active tab selects the nearest valid tab.
- [ ] Closing the final tab creates a replacement note.
- [ ] Titles and content persist after reload.
- [ ] Markdown and JSON content receive the intended editor language behavior.
- [ ] Theme and Zen controls work without losing document content.
- [ ] Text tools transform content and report invalid input safely.
- [x] Snapshots can be created, listed, restored, and compared.
- [x] Command palette opens with `Ctrl/Cmd+K`, supports Escape, and invokes actions.
- [ ] Encrypted share output is generated without a network request.
- [x] Share output can be decrypted by the supported import path.

## 3. Data integrity and recovery

- [ ] IndexedDB state is written after edits.
- [ ] State survives normal reload.
- [ ] Invalid persisted records are ignored safely.
- [ ] Missing active-tab identifiers recover to a valid tab.
- [ ] Legacy active-document data migrates correctly.
- [x] Snapshot cap behavior is verified.
- [x] Snapshot ordering, corrupted persistence, and legacy migration are verified by unit tests.
- [ ] Empty documents do not create misleading snapshots.
- [ ] Storage failure behavior is documented and tested.

## 4. Security and privacy

- [ ] No editor content is sent to a remote service.
- [ ] AES-GCM uses a fresh IV per encryption operation.
- [ ] Decryption rejects modified payloads.
- [ ] Share strings are not persisted automatically.
- [ ] Clipboard use is user initiated.
- [ ] Security limitations are visible in the handoff documentation.

## 5. Quality and accessibility

- [x] Unit tests pass.
- [x] E2E tests pass in supported Chromium for covered flows.
- [x] Keyboard-only navigation is usable.
- [x] Dialogs have accessible names and modal semantics.
- [x] Buttons and inputs have accessible labels.
- [x] Modal keyboard focus is contained and restored for covered flows.
- [x] Contrast meets the project accessibility target.
- [ ] Desktop and mobile-sized layouts have no clipping or horizontal overflow.
- [ ] Large documents remain usable.
- [x] Axe WCAG A/AA scan reports no serious/critical violations (main surface and command palette open).
- [x] CodeMirror editor has an accessible name ("Note editor").

## 6. PWA and offline

- [x] Production build emits the service worker.
- [x] Manifest contains application name, colors, display mode, and icons.
- [ ] App can be installed in a supported browser.
- [x] App shell reloads while offline after first visit.
- [x] Existing IndexedDB documents remain available offline.
- [x] Service worker registers with the configured auto-update lifecycle.
- [ ] PWA icons render correctly at declared sizes.

## 7. Delivery evidence

- [x] Build command and output recorded.
- [x] Lint command and output recorded.
- [x] Unit test report attached or recorded.
- [x] E2E report attached or recorded.
- [ ] Browser/version matrix recorded.
- [ ] Known issues and accepted risks approved.
- [ ] Handoff owner and support owner assigned.
- [ ] Release decision signed by engineering and product owners.
