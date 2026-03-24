# Requirements: Restaurant POS Android

**Defined:** 2026-03-23  
**Core Value:** The app lets restaurant staff manage tables, orders, and billing quickly in a calm, premium interface without depending on a server for core operations.  
**Status:** Drafted from the supplied app plan. Ready for your review before implementation.

## v1 Requirements

### UX and Visual Design

- [ ] **UX-01**: The interface uses the supplied sober pastel palette with defined variables for background, cards, veg, non-veg, action, and secondary text colors.
- [ ] **UX-02**: Table cards and item cards use large radii and soft depth instead of harsh borders.
- [ ] **UX-03**: The layout preserves breathing room and calm hierarchy during busy service.
- [ ] **UX-04**: Billing summaries or bottom navigation can use subtle glassmorphism without reducing readability.

### Floor and Table Flow

- [ ] **FLOR-01**: The floor view presents a minimalist grid of tables with clear availability status.
- [ ] **FLOR-02**: Occupied tables show a subtle pulse or equivalent low-noise visual indicator.
- [ ] **FLOR-03**: Selecting a table opens the current order in a smooth slide-up order sheet instead of a disruptive popup.
- [ ] **FLOR-04**: Long-press on a table allows the active order to move to another table through local state updates.

### Menu and Search

- [ ] **MENU-01**: Staff can search menu items by code or name from a prominent search field.
- [ ] **MENU-02**: Menu items can be differentiated visually for veg and non-veg using the supplied accent approach.
- [ ] **MENU-03**: Staff can add items to the current table order from the order sheet flow.

### Billing Engine and Settings

- [ ] **BILL-01**: A local billing engine computes subtotal, discount, service charge, GST, and total payable instantly as items change.
- [ ] **BILL-02**: Total payable follows the supplied formula and rounds the final amount after service charge and GST are applied.
- [ ] **BILL-03**: Service-charge percentage is editable from a local Settings page.
- [ ] **BILL-04**: GST percentage is editable from a local Settings page.
- [ ] **BILL-05**: Billing calculations are shared consistently across order sheet, receipt, and daily summary outputs.

### Offline Persistence and Recovery

- [ ] **DATA-01**: Every item add, remove, or quantity change persists the table order immediately to IndexedDB.
- [ ] **DATA-02**: Orders survive app crashes, tab refreshes, or device restarts through IndexedDB recovery.
- [ ] **DATA-03**: Billing history is stored locally in IndexedDB for later review.
- [ ] **DATA-04**: Core order and billing flows remain usable without a server connection.

### Printing and Output

- [ ] **PRNT-01**: The app can generate a bill PDF locally on the device.
- [ ] **PRNT-02**: The print view hides non-receipt UI so only the receipt or bill content is sent to the printer.
- [ ] **PRNT-03**: The generated output is suitable for Android print-service workflows.

### Reporting and Summary

- [ ] **RPTG-01**: An End of Day screen shows total revenue for the day.
- [ ] **RPTG-02**: An End of Day screen shows most sold items.
- [ ] **RPTG-03**: An End of Day screen shows payment-mode splits such as UPI and cash.

## v2 Requirements

### Deferred Enhancements

- **PACK-01**: Confirm and optimize the chosen Android packaging strategy for distribution and device management.
- **PRNT-04**: Add direct thermal-printer-specific optimization beyond browser print CSS.
- **SYNC-01**: Add optional backup or sync beyond single-device local operation.
- **RPTG-04**: Add exportable reports and deeper analytics.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mandatory backend for v1 billing and order flow | The supplied plan is explicitly local-first |
| Native Kotlin or Compose implementation for now | The current plan specifies web stack concepts such as IndexedDB and browser print |
| Loyalty, delivery marketplaces, and advanced integrations in v1 | Not part of the supplied initial plan |
| Heavy popup-driven workflow | Conflicts with the calm drawer-first UX direction |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UX-01 | Phase 1 | Pending |
| UX-02 | Phase 1 | Pending |
| UX-03 | Phase 1 | Pending |
| UX-04 | Phase 1 | Pending |
| FLOR-01 | Phase 3 | Pending |
| FLOR-02 | Phase 3 | Pending |
| FLOR-03 | Phase 3 | Pending |
| FLOR-04 | Phase 3 | Pending |
| MENU-01 | Phase 3 | Pending |
| MENU-02 | Phase 1 | Pending |
| MENU-03 | Phase 3 | Pending |
| BILL-01 | Phase 2 | Pending |
| BILL-02 | Phase 2 | Pending |
| BILL-03 | Phase 2 | Pending |
| BILL-04 | Phase 2 | Pending |
| BILL-05 | Phase 2 | Pending |
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 2 | Pending |
| DATA-04 | Phase 2 | Pending |
| PRNT-01 | Phase 4 | Pending |
| PRNT-02 | Phase 4 | Pending |
| PRNT-03 | Phase 4 | Pending |
| RPTG-01 | Phase 5 | Pending |
| RPTG-02 | Phase 5 | Pending |
| RPTG-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-23*  
*Last updated: 2026-03-23 after user app-plan update*
