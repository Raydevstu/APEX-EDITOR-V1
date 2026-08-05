# ApexPad Enterprise Documentation

**Product:** ApexPad offline-first multi-tab notepad editor  
**Documentation baseline:** 2026-08-05  
**Repository:** `apex-pad/`  
**Document owner:** Engineering  
**Status:** **Release candidate — release decision signed (Go) 2026-08-05.** Feature-complete; design system (V2) complete; all four release gates (PWA install/update, screen-reader/keyboard, security, performance) closed with recorded evidence.

## Purpose

This documentation set is the operational source of truth for implementation, progress reporting, engineering handoff, release readiness, and testing.

## Documents

1. [Implementation Standards and Architecture](./01-implementation-standards.md)
2. [Implementation Progress and Gap Register](./02-implementation-progress.md)
3. [Engineering Handoff Document](./03-engineering-handoff.md)
4. [Release and Delivery Checklist](./04-release-checklist.md)
5. [Test Strategy and QA Record](./05-test-strategy-and-qa.md)
6. [Design System](./06-design-system.md)

## Current executive status

The application has a functional editor foundation and all requested local editing capabilities. Multi-tab editing, IndexedDB persistence, text-tool worker processing, snapshots, command palette, encrypted sharing, diff viewing, and PWA build generation are implemented.

As of 2026-08-05 all four release gates are closed: PWA install/update verified, keyboard + screen-reader-tree accessibility audited across every surface in both themes, security review clean (no network exfiltration, `pnpm audit` clean), and startup profiled (FCP/LCP 180 ms, load 89 ms). The release decision is **Go**; non-blocking follow-ups are a broader browser matrix and an external screen-reader validation.

## Status vocabulary

- **Complete:** implemented and verified by an applicable automated or inspection check.
- **Partial:** implementation exists, but one or more acceptance or verification requirements remain.
- **In progress:** actively implemented but not yet stable or fully verified.
- **Blocked:** cannot be verified or completed until a named dependency/action is available.
- **Not started:** no production implementation exists.

## Change control

Every material implementation change must update the progress register, relevant acceptance checklist, and test record. Handoff documents must identify known limitations rather than implying unverified readiness.
