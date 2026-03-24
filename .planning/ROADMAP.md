# Roadmap: Restaurant POS Android

**Date:** 2026-03-23  
**Status:** Provisional roadmap based on the supplied local-first app plan

## Summary

**5 phases** | **26 v1 requirements mapped** | **Planning only - no implementation started**

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | Design System and Visual Shell | Establish the Cred-style look, shared tokens, and low-noise surface language | UX-01, UX-02, UX-03, UX-04, MENU-02 |
| 2 | Local State, Billing, and Persistence Core | Build the local data model, IndexedDB persistence, settings, and billing engine | BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, DATA-01, DATA-02, DATA-03, DATA-04 |
| 3 | Floor, Search, and Order Flow | Deliver the table grid, order sheet drawer, search, item add flow, and table switching | FLOR-01, FLOR-02, FLOR-03, FLOR-04, MENU-01, MENU-03 |
| 4 | Printing and Receipt Output | Add local PDF generation and clean Android-compatible print output | PRNT-01, PRNT-02, PRNT-03 |
| 5 | End-of-Day Summary and Operational Polish | Deliver local reporting and final UX cleanup for restaurant operations | RPTG-01, RPTG-02, RPTG-03 |

## Phase Details

### Phase 1: Design System and Visual Shell

**Goal:** Lock the visual identity before interaction-heavy feature work begins.

**Success criteria**
1. Global design tokens exist for palette, spacing, radius, and elevation.
2. The UI reflects the supplied Cred-style calm aesthetic rather than a generic PoS look.
3. Veg and non-veg accents are visually distinct but restrained.

### Phase 2: Local State, Billing, and Persistence Core

**Goal:** Make the core business logic reliable and fully local-first.

**Success criteria**
1. Billing logic is isolated in a reusable local module.
2. IndexedDB persists order mutations automatically.
3. Crash recovery restores the last known table and order state.
4. Billing settings are editable locally and affect all calculations consistently.

### Phase 3: Floor, Search, and Order Flow

**Goal:** Enable the main restaurant service workflow from table selection to item management.

**Success criteria**
1. Staff can move from floor view to order sheet without modal-heavy interruption.
2. Search is fast enough for live service by item code or name.
3. Table switching works entirely through local state transitions.
4. Occupancy signals remain visible without becoming visually noisy.

### Phase 4: Printing and Receipt Output

**Goal:** Complete local billing output without needing a server.

**Success criteria**
1. Bill PDFs can be generated locally.
2. Print CSS removes live UI chrome from the bill output.
3. Android printing is practical within the selected runtime or wrapper.

### Phase 5: End-of-Day Summary and Operational Polish

**Goal:** Close the operational loop with simple daily reporting and UX hardening.

**Success criteria**
1. Daily revenue, popular items, and payment splits are computed locally.
2. Summary values stay consistent with billing history.
3. The interface remains calm and readable during dense workflows.

## Notes

- This roadmap assumes the supplied local-first web architecture is intentional.
- If you decide to switch back to a native Android implementation, the roadmap should be regenerated before building.

---
*Roadmap created: 2026-03-23*  
*Last updated: 2026-03-23 after user app-plan update*
