# Domain Pitfalls: Restaurant POS Android

**Date:** 2026-03-23  
**Status:** Risks specific to the current local web architecture plan

## 1. Treating LocalStorage as sufficient

- **Warning signs:** Order payloads get too large, crash recovery is unreliable, history is awkward to query.
- **Prevention:** Use IndexedDB from day one for structured offline data.

## 2. Making billing logic part of the UI

- **Warning signs:** Totals differ between the order sheet, summary, and receipt.
- **Prevention:** Keep a single billing engine module used by all screens and outputs.

## 3. Relying on browser defaults for thermal printing

- **Warning signs:** Receipts include buttons, navigation, or broken spacing.
- **Prevention:** Create dedicated print CSS and receipt templates early.

## 4. Using too many overlays during service

- **Warning signs:** Staff lose context between table selection, item selection, and billing.
- **Prevention:** Prefer drawers, inline state, and smooth transitions over stacked modals.

## 5. Ignoring Android packaging constraints

- **Warning signs:** Features work in desktop browser tests but fail on-device printing or file handling.
- **Prevention:** Confirm the exact Android wrapper or runtime before implementation.

## 6. Hardcoding tax and service-charge rules

- **Warning signs:** Every policy change becomes a code change.
- **Prevention:** Store editable billing settings locally and route calculations through them.
