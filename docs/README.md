# ApexPad Enterprise Documentation

**Product:** ApexPad offline-first multi-tab notepad editor  
**Documentation baseline:** 2026-08-05  
**Repository:** `apex-pad/`  
**Document owner:** Engineering  
**Status:** Feature-complete internal QA; accessibility audit closed; release hold pending PWA install/update, screen-reader, security, and performance review

## Purpose

This documentation set is the operational source of truth for implementation, progress reporting, engineering handoff, release readiness, and testing.

## Documents

1. [Implementation Standards and Architecture](./01-implementation-standards.md)
2. [Implementation Progress and Gap Register](./02-implementation-progress.md)
3. [Engineering Handoff Document](./03-engineering-handoff.md)
4. [Release and Delivery Checklist](./04-release-checklist.md)
5. [Test Strategy and QA Record](./05-test-strategy-and-qa.md)

## Current executive status

The application has a functional editor foundation and the majority of the requested local editing capabilities. Multi-tab editing, IndexedDB persistence, text-tool worker processing, snapshots, command palette, encrypted sharing, diff viewing, and PWA build generation are implemented.

The application is not yet release-ready. Core unit/E2E validation, Chromium setup, responsive mobile smoke, offline cached-shell reload, encrypted sharing round-trip, command palette focus-return QA, and the automated axe WCAG A/AA accessibility audit are complete. Remaining gates are the formal screen-reader pass, PWA install/update validation, security sign-off, and a measured performance decision.

## Status vocabulary

- **Complete:** implemented and verified by an applicable automated or inspection check.
- **Partial:** implementation exists, but one or more acceptance or verification requirements remain.
- **In progress:** actively implemented but not yet stable or fully verified.
- **Blocked:** cannot be verified or completed until a named dependency/action is available.
- **Not started:** no production implementation exists.

## Change control

Every material implementation change must update the progress register, relevant acceptance checklist, and test record. Handoff documents must identify known limitations rather than implying unverified readiness.
