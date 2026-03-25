# Features

This document describes the current product surface of **AMP PoS** in user-facing terms.

## Floor Service

- Table floor view with live table status
- Walk-in order flow
- Compact and detailed table display modes
- Long-press table move flow
- Immediate reopen of active local drafts

## In-Table Ordering

- Dedicated `Menu` and `Current Bill` tabs
- Category-based menu browsing
- Quick search by name or code
- Add and remove dish quantities with minimal taps
- Compact and detailed menu card layouts

## Billing

- Live subtotal, discount, service charge, GST, rounding, and total calculation
- GST can be enabled or disabled
- GST number is required only when GST is enabled
- Payment mode selection
- Close-and-bill flow with receipt generation

## Restaurant Setup And Branding

- First-run setup for restaurant identity
- Restaurant name
- Receipt footer
- Table count
- Appearance mode
- Optional logo
- Branding editable later in Settings

## Menu Studio

- Create, edit, and delete dishes
- Existing-category selection for new dishes
- Category management with guarded delete behavior
- Dish type support for veg and non-veg
- Dish code, note, and price management

## Analytics

- Historical bill list
- Daily bill filter
- Payment split summary
- Day-vs-day comparison
- Month-vs-month comparison
- Dish-level analytics

## Device Integration

- Android shell packaging
- Native print path
- Bluetooth printer discovery and output
- Local backup export and restore
- Timestamped backup archives plus latest backup file

## Reliability

- Immediate recovery snapshot writes
- IndexedDB-backed local persistence
- Lifecycle flush hooks
- Backup scheduling through the Android shell

## Current Position

The implemented app already covers the main offline restaurant PoS loop:
setup, floor service, ordering, billing, analytics, backup, and Android packaging.
