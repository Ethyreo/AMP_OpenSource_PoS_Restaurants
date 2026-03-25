# Architecture

This app is intentionally built as a local-first web application packaged inside an Android WebView shell. The runtime is designed for restaurant floor operations where internet connectivity is optional and server-side infrastructure is not required for the core workflow.

## Runtime Choice

- Primary app runtime:
  HTML, CSS, and JavaScript served from local Android assets
- Android wrapper:
  Android Studio WebView shell in `android-shell/`
- No server requirement:
  all floor, order, billing, history, analytics, and branding flows run locally on-device

## High-Level Stack

- UI layer:
  `index.html` plus render logic in `app/scripts/ui/render.js`
- State layer:
  `app/scripts/state/store.js`
- Domain logic:
  `app/scripts/domain/billing.js`
- Data layer:
  `app/scripts/data/repository.js` and `app/scripts/data/indexeddb.js`
- Android shell:
  `android-shell/app/src/main/java/com/boneandbilling/pos/`

## Core Data Model

- `settings`
  restaurant identity, taxes, table count, appearance, printer preference, backup preferences, and UI mode selections
- `menu`
  dish catalog with code, name, category, price, type, and note
- `tables`
  table metadata plus active order state
- `billHistory`
  completed receipts used for summary and analytics

## Persistence Strategy

- IndexedDB is the main structured local database.
- A recovery snapshot is also mirrored to local storage to reduce data loss from crashes or interrupted IndexedDB writes.
- Important mutations write through the recovery path before the queued IndexedDB flush.
- Lifecycle hooks attempt to flush persistence on visibility change and unload-style transitions.

## Backup Strategy

- Manual export:
  JSON backup from app state
- Automatic latest backup:
  mirrored into `Downloads/KenPoS/ken-pos-backup-latest.json`
- Timestamped archives:
  created on meaningful events such as bill close and setup/settings updates
- Native scheduled backup:
  Android `WorkManager` path keeps scheduled backup support inside the shell

## Android Shell Responsibilities

- Host local web assets from app package storage
- Expose JavaScript bridge methods for:
  printing
  backup read/write
  backup listing
  branded shortcut sync
  Bluetooth printer discovery and printing
  Android-specific file and device actions
- Persist WebView state across recreation where possible
- Provide runtime logging and device-specific integration points

## Printing

- Receipt HTML is rendered in the web app.
- Android printing uses a native bridge path rather than browser print alone.
- Bluetooth receipt output is also available for paired printers through the Android bridge.
- Historical bills and active receipts share the same rendering pipeline.

## Setup And Branding

- First launch uses a setup overlay for restaurant identity and billing defaults.
- Restaurant name, footer, GST configuration, logo, and table count are part of the local workstation identity.
- Branding is editable later in Settings.

## Navigation Model

- Main tabs:
  Floor, Analytics, Settings
- In-table workspace:
  Menu tab and Current Bill tab
- Settings workspace:
  restaurant setup, printer tools, backup tools, menu studio, and category management
- Dish editor:
  dedicated modal-style editor window for create/edit flows

## Design Direction

- The app targets a sober premium look rather than dense enterprise UI.
- Visual principles:
  whitespace
  rounded panels
  softened contrast
  glass and depth treatments
  mobile-friendly touch targets
- Operationally, clarity beats ornament:
  the UI should stay calm under service pressure.

## Key Files

- `index.html`
- `app/scripts/main.js`
- `app/scripts/ui/render.js`
- `app/scripts/state/store.js`
- `app/scripts/data/repository.js`
- `app/scripts/data/indexeddb.js`
- `android-shell/app/src/main/java/com/boneandbilling/pos/MainActivity.kt`
- `android-shell/app/src/main/java/com/boneandbilling/pos/AndroidHostBridge.java`
- `android-shell/app/src/main/java/com/boneandbilling/pos/BackupStorage.java`
- `android-shell/app/src/main/java/com/boneandbilling/pos/PrintBridge.kt`

## Known Constraints

- The app is optimized for offline local service, not multi-device synchronization.
- Backup reliability depends on local storage health and Android OS behavior.
- Android-specific behavior can differ from desktop browser behavior, so real-device testing remains important.
- UI polish and ergonomics should always be validated on the actual target phone or tablet.
