# Architecture Baseline: Restaurant POS Android

**Date:** 2026-03-23  
**Status:** Based on the supplied Antigravity-style local app plan

## Recommended Structure

Use a layered local architecture:

- **Presentation layer:** HTML structure plus CSS-driven layout and transitions
- **State layer:** In-memory JavaScript objects for current floor, active table, current bill, and app settings
- **Domain layer:** Billing calculations, table switching rules, and end-of-day aggregation logic
- **Persistence layer:** IndexedDB repositories for orders, tables, settings, and summaries
- **Output layer:** Print templates and PDF generation modules

## Core Flows

1. User opens the floor view.
2. Selecting a table opens the order sheet drawer.
3. Adding or removing items updates the in-memory state.
4. Every mutation is persisted immediately to IndexedDB.
5. Billing engine recalculates totals locally.
6. Receipt view or PDF output is generated locally when checkout completes.
7. Summary data is aggregated locally at end of day.

## UX Layout Guidance

- Keep the floor view spacious and low-noise.
- Use subtle animation only for occupied state and drawer transitions.
- Avoid modal-heavy flows during active service.
- Use large-radius cards and strong whitespace.
- Keep print views intentionally separate from live UI chrome.

## Architectural Risks

- Browser print behavior can vary across Android environments.
- IndexedDB schema and migration strategy must be designed early.
- Tax math and rounding must remain consistent across summary, receipt, and detail screens.
- Multi-tab or multi-session behavior must be controlled if the app can reopen concurrently.
