# Restaurant POS Android

## What This Is

This project is a planning scaffold for a restaurant point-of-sale app intended to run locally on Android devices using an Antigravity IDE web stack. The current direction is a premium, Cred-style interface with all critical logic handled on-device through local JavaScript modules, IndexedDB persistence, and local printing flows. No build work has started yet; this workspace is for locking the product and architecture before implementation.

## Core Value

The app lets restaurant staff manage tables, orders, and billing quickly in a calm, premium interface without depending on a server for core operations.

## Requirements

### Validated

(None yet - planning stage only)

### Active

- [ ] Preserve the provided Cred-style visual language as a non-negotiable UX baseline.
- [ ] Keep core order, billing, and printing flows fully local-first on the device.
- [ ] Use IndexedDB, not LocalStorage, for structured offline persistence.
- [ ] Support restaurant floor management, billing, and end-of-day reporting as the initial scope.
- [ ] Confirm whether the delivery model is packaged web app, PWA, or another Android wrapper before building.

### Out of Scope

- Building production code before the final architecture choice is confirmed.
- Introducing a mandatory backend for core restaurant flows in v1.
- Expanding into loyalty, delivery marketplace, or multi-branch sync features before the single-device local flow is stable.

## Context

The supplied plan emphasizes a Cred-inspired aesthetic: breathing room, subtle depth, premium typography, soft glassmorphism, and muted pastel accents. The user also specified a local-only operating model in which order state, billing history, and summary data live on-device. That shifts the architecture away from a native Android-first plan and toward a local web app architecture deployed on Android hardware. This distinction matters because storage, printing, navigation, and packaging decisions will differ materially from a native Kotlin app.

## Constraints

- **Design**: Use a sober pastel, high-end interface with soft depth and minimal visual clutter.
- **Runtime**: Keep business logic local to the device with no server dependency for core flows.
- **Persistence**: Use IndexedDB for order state, billing history, and crash recovery.
- **Billing**: Tax and service-charge rules must be editable locally through Settings.
- **Printing**: Bills must be generated locally and sent through Android-compatible print flows.
- **Platform clarity**: Packaging strategy still needs confirmation because the plan describes a web architecture running on Android.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use a local-first web architecture inside the Android delivery target | Matches the provided plan centered on IndexedDB, local JS modules, and browser printing | - Pending |
| Use IndexedDB instead of LocalStorage | Structured offline data and better reliability for orders and billing history | - Pending |
| Treat billing as a dedicated local calculation module | Tax and service-charge math must stay deterministic and editable | - Pending |
| Keep the UI premium but low-noise | Busy restaurant staff need clarity under pressure, not decoration overload | - Pending |
| Delay implementation until native-vs-web packaging is explicitly confirmed | Prevents building the wrong foundation | - Pending |

---
*Last updated: 2026-03-23 after app-plan update*
