# Project Journey

This file captures the app journey in chronological order so future work can recover both the product intent and the technical path taken to reach the current state.

## Phase 1: Direction And Scope

- The product started as a restaurant PoS app request for Android with a strong emphasis on structure before implementation.
- The original plan defined a local-only operating model with no server dependency.
- The intended design language was premium, calm, and Cred-inspired: high whitespace, pastel depth, glass effects, and low-clutter workflows.
- A `docs` folder was explicitly requested so the project history and requirements could be preserved from the start.

## Phase 2: Core Product Definition

- The initial product scope focused on floor service, order taking, billing, daily summary, quick item search, table switching, and local PDF/print output.
- The storage direction shifted from simple browser storage to IndexedDB for structured local persistence.
- Billing rules were aligned to Indian restaurant use cases, including service charge, GST, discount handling, and rounded totals.
- The app direction was clarified as a local-first web runtime on Android rather than a native Kotlin-first PoS.

## Phase 3: First Working App

- A first functional build was created around a local web app shell with IndexedDB-backed tables, menu, settings, and bill history.
- The UI included floor management, a dish search flow, an order drawer, receipt rendering, and basic analytics.
- A service worker and static packaging path were added for offline-capable behavior in browser contexts.

## Phase 4: Android Shell

- An Android Studio project was added to wrap the app in a WebView shell.
- Local web assets were synced into Android assets for a fully local runtime.
- Printing, backup access, and other device-specific actions were routed through an Android JavaScript bridge.
- This made the app runnable directly on a real Android phone without any backend.

## Phase 5: Product Expansion

- Setup flow was added for restaurant identity, receipt footer, floor size, tax defaults, and optional logo.
- Branding was made dynamic, including launch attribution and restaurant-specific launch copy.
- Menu management was expanded with category handling, dish CRUD, and a dedicated menu studio.
- Floor cards and menu cards both received compact modes for denser operating layouts.
- Analytics grew to include historical bills, day-vs-day comparison, month-vs-month comparison, payment splits, and dish analytics.

## Phase 6: Operational Hardening

- Order changes were changed to write through to a recovery snapshot immediately before IndexedDB flushes.
- Lifecycle persistence hooks were added to reduce loss from crashes, background kills, and accidental closure.
- Backup export and restore flows were added, then later expanded into timestamped archives plus a rolling latest backup.
- Android `WorkManager` scheduling was introduced so the app could keep a scheduled external backup path on-device.

## Phase 7: Real Device Testing

- The app was repeatedly installed on a connected Android device and verified on actual hardware.
- Multiple issues only visible on-device were fixed, including:
  - print bridge crashes
  - startup/setup scroll issues
  - setup form reset behavior
  - hidden mobile access to settings
  - backup import edge cases
  - inconsistent local save behavior
- Bluetooth printer handling and Android-specific receipt paths were added and refined during this stage.

## Phase 8: UI Refinement

- The interface was pushed toward a more minimal premium direction while keeping it usable during busy restaurant shifts.
- Settings and menu management were reorganized to reduce clutter.
- In-table interactions were split into clearer tabs.
- Compact floor and compact menu modes were added for operators who prefer denser visual layouts.
- The dish editor was moved out of the inline page flow into a dedicated modal-style window.

## Phase 9: Stabilization And Repo Sync

- Startup issues were traced to initialization and render-path problems rather than only CSS behavior.
- Android shell updates were added to support stronger runtime logging and more reliable device integration.
- A missing startup variable in `main.js` caused the initial render path to fail before setup bindings were attached; that was later identified as a critical blocker.
- The codebase was synchronized to GitHub after major stabilization work.
- Local device backup artifacts were explicitly excluded from source control.

## Current State

- The app is a local-first Android-targeted restaurant PoS with:
  - restaurant setup and branding
  - floor management
  - menu and category management
  - billing with configurable GST
  - receipt rendering and Android print integration
  - local analytics
  - crash-recovery-oriented persistence
  - backup export and restore flows
- The project is active and still benefits from device-based UX polish, but the major product loop is implemented.

## Recommended Next Docs To Read

- `../architecture/README.md`
- `../operations/SESSION-LOG.md`
- `../operations/README.md`
- `../product/2026-03-23-app-plan.md`
