# Stack Baseline: Restaurant POS Android

**Date:** 2026-03-23  
**Status:** User-directed local-first architecture baseline

## Recommendation Summary

The supplied plan points to a local web application architecture intended for Android devices rather than a native Kotlin app. The stack baseline should therefore center on HTML, CSS, and JavaScript modules inside Antigravity IDE, with IndexedDB for persistence and browser-side print or PDF generation for billing output.

## Proposed Technology Baseline

### UI Layer

- **Markup:** Semantic HTML structure for table views, drawers, summaries, and receipts
- **Styling:** Modern CSS using variables, Grid, Flexbox, soft shadows, large radii, and selective glassmorphism
- **Design system:** Global `:root` tokens for palette, spacing, elevation, radius, and typography

### State and Logic

- **App state:** Local JavaScript state containers for floor state, active order, billing summary, and settings
- **Business rules:** Dedicated billing engine module for subtotal, discount, service charge, GST, and total rounding
- **Interaction style:** Drawer and smooth-transition flows instead of disruptive modal-heavy UX

### Persistence and Output

- **Primary storage:** IndexedDB for structured offline storage of tables, orders, and billing history
- **Auto-save model:** Persist every order mutation immediately
- **PDF generation:** Client-side bill generation with a library such as jsPDF
- **Printing:** Browser print flow with print-specific CSS for thermal receipts and minimalist invoices

## Recommended App Modules

```text
app/
├─ styles/
│  ├─ tokens.css
│  ├─ layout.css
│  └─ print.css
├─ ui/
│  ├─ floor/
│  ├─ order-sheet/
│  ├─ billing/
│  ├─ summary/
│  └─ settings/
├─ state/
│  ├─ floor-store.js
│  ├─ order-store.js
│  └─ settings-store.js
├─ domain/
│  ├─ billing-engine.js
│  ├─ totals.js
│  └─ table-switching.js
├─ data/
│  ├─ indexeddb.js
│  ├─ orders-repo.js
│  └─ summary-repo.js
└─ print/
   ├─ receipt-template.js
   └─ pdf-export.js
```

## Why This Fits the Supplied Plan

- The design language is easiest to express with CSS variables, depth, and layout primitives.
- IndexedDB is the right level of storage for offline tables, order drafts, and billing history.
- Billing and print logic can stay completely local.
- Android remains the device target while the implementation model stays browser-like and offline-first.

## Critical Clarification

If you actually want a native Android app, this stack is the wrong foundation. The current plan should be treated as a packaged local web app or PWA approach unless you intentionally want it converted into native Android patterns.

