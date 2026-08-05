# ApexPad Test Strategy and QA Record

## 1. Test objectives

Testing must prove that ApexPad preserves local document integrity, provides predictable multi-tab behavior, performs transformations safely, keeps sensitive content local, and remains usable as an installable offline application.

## 2. Test layers

### Unit tests

Use Vitest for deterministic pure utilities and store behavior. Unit tests must not import Playwright files.

Required unit coverage:

- JSON formatting success and invalid JSON failure.
- Whitespace stripping with blank, whitespace-only, and mixed lines.
- Duplicate-line removal while preserving first occurrence order.
- CSV spacing normalization.
- AES-GCM encrypt/decrypt round trip.
- Tampered ciphertext rejection.
- Snapshot creation, per-tab filtering, ordering, and 50-item cap.
- Tab closing behavior, including final-tab replacement.
- Active-tab recovery from invalid persisted state.
- Legacy document migration.

### Component tests

Add focused tests for:

- Tab selection and close controls.
- Title input updates.
- Snapshot empty state and restore action.
- Tool drawer success and error messages, dialog semantics, focus-in, Tab trap, Escape, and live status.
- Command palette filtering, Escape, and action execution.
- Share modal copy action and error handling.
- Diff viewer empty/current-only/changed-line states, Tab containment, and accessible diff region name.

### E2E tests

Playwright must run only files under `e2e/` with a dedicated configuration. Required browser flows:

1. Load the editor shell.
2. Create a second tab and switch between tabs.
3. Enter content and confirm title/content remain after reload.
4. Close active and inactive tabs.
5. Open command palette and create a note.
6. Open text tools and apply a transformation.
7. Create a snapshot, edit content, open diff, and restore.
8. Generate encrypted share output.
9. Verify mobile-sized viewport has no horizontal overflow.
10. Verify installed/offline reload behavior using a production preview.

## 3. Current QA evidence

| Check | Result | Evidence/date | Action |
|---|---|---|---|
| Production build | Pass | `pnpm build`, 2026-08-05 | Monitor bundle warning |
| Lint | Pass | `pnpm lint`, 2026-08-05 | None |
| Unit tests | Pass, 24 tests / 5 files | `pnpm test`, 2026-08-05 | None |
| Playwright config | Present | `playwright.config.ts` | None |
| E2E browser run | Pass, 24 tests | `pnpm test:e2e`, Chromium, 2026-08-05 | Broaden browser matrix before public release |
| Automated accessibility scan | Pass, axe WCAG A/AA | `e2e/accessibility.spec.ts` + `accessibility-light.spec.ts`, 2026-08-05: main, palette, tools, snapshots, share, diff (dark) + main/share (light) | Scan additional dialog states over time |
| Keyboard accessibility audit | Pass | `e2e/keyboard-a11y.spec.ts`, 2026-08-05: tab order, focus trap, Escape, focus return, modal semantics | None |
| PWA installability | Pass | `e2e/pwa-install.spec.ts`, 2026-08-05: manifest, icons at declared sizes, SW registration, install event surfaced | None |
| SW update lifecycle | Pass | `scripts/sw-update-rehearsal.mjs`, 2026-08-05: `reg.update()` activates new worker (autoUpdate) | None |
| Security review | Pass | No network calls in app code; fresh IV; tamper rejection tested; `pnpm audit` clean (prod + full), 2026-08-05 | None |
| Startup profiling | Pass | `scripts/profile.mjs`, production preview, 2026-08-05: FCP/LCP 180 ms, load 89 ms, one 65 ms long task | Keep CodeMirror; re-measure if deployed remotely |
| Responsive browser QA | Pass, mobile smoke | 390x844 Chromium test, 2026-08-05 | Expand viewport matrix |
| Offline browser QA | Pass, cached shell | Production preview + offline reload, 2026-08-05 | None |
| Accessibility audit | Complete | Axe WCAG A/AA clean across all surfaces in both themes; focus management; accessible names; contrast fixes landed (dark/light accent, muted/faint, `text-onAccent` class) | Formal external screen-reader pass recommended pre-announcement |

## 4. Test environment

Record the following for every release candidate:

- Operating system and version.
- Node.js and pnpm versions.
- Browser name and exact version.
- Viewport size.
- Build commit or package version.
- Whether tests ran against Vite dev server or production preview.
- IndexedDB state setup and cleanup procedure.

## 5. Test isolation correction (completed)

Vitest is restricted to `src/**/*.test.{ts,tsx}` and excludes `e2e/**`. The acceptance condition is met:

- `pnpm test` runs unit tests only and exits successfully.
- `pnpm test:e2e` runs browser tests only.
- Neither command imports the other runner's test files.

## 6. Defect severity

- **P0:** data loss, cross-user data exposure, broken encryption integrity, or production install failure.
- **P1:** core editing, persistence, tab, snapshot, or reload workflow broken.
- **P2:** feature works with a significant usability, accessibility, or responsive defect.
- **P3:** cosmetic issue, non-blocking warning, or documentation gap.

No P0/P1 defects may remain for release. P2 defects require product and engineering acceptance. P3 defects must be recorded with an owner.

## 7. Exit criteria

Testing is complete when the unit suite, E2E suite, build, lint, browser matrix, accessibility checks, responsive checks, offline checks, and release checklist all pass or have explicitly approved exceptions.
