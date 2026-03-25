# Session Log

This file records the most important implementation and stabilization events that occurred while building the app. It is not a perfect raw transcript. It is a curated operational log intended to help future work recover context quickly.

## 2026-03-23 To 2026-03-25: Major Build And Fix Log

### Foundation

- Project scaffold created for a restaurant PoS app.
- Requirement set captured from the original local-first plan.
- `docs/` structure created at the start to preserve context.
- Runtime direction clarified:
  packaged local web app inside Android shell rather than server-backed stack.

### First Functional App

- Floor view, order drawer, menu, billing engine, and basic analytics implemented.
- IndexedDB persistence added for settings, menu, tables, and bill history.
- Android Studio WebView shell created and wired to local assets.

### Device Integration

- Native print bridge added for receipts.
- Bluetooth printer discovery and print support added.
- Web assets synchronized into Android shell for real device testing.
- Repeated APK installs performed on a connected Android phone.

### Product Additions

- Restaurant setup flow added.
- Editable restaurant branding added, including logo and receipt footer.
- Table-count configuration added.
- Category management and dish CRUD added.
- In-table drawer split into `Menu` and `Current Bill`.
- Compact floor and compact menu modes added.
- Analytics expanded with bill filtering and comparison tools.

### Billing And Tax

- GST enable/disable support added.
- GST number required only when GST is enabled.
- Receipt rendering updated to show GST details conditionally.
- Billing totals updated to respect GST state.

### Persistence And Recovery

- Order mutations changed to write a recovery snapshot immediately.
- Lifecycle flush hooks added to reduce data loss.
- Backup export/import flows added.
- Later expanded into:
  - latest backup file
  - timestamped archives
  - backup catalog listing
  - Android scheduled backup support

### Android-Only Failures Fixed

- Print crash caused by off-main-thread WebView work in the print bridge.
- Setup screen scroll and keyboard reachability issues on phone.
- Hidden mobile access to Settings.
- Backup import path failures and restore edge cases.
- Rebuild/install incompatibility from signing mismatch during one device iteration.

### UI And Workflow Refinement

- Header simplified to `AMP x {Restaurant name}`.
- Quick search moved into the in-table menu workspace.
- Dish editor moved out of inline page flow into a dedicated modal-style editor.
- Compact tiles and compact menu presentation refined for operator preference.

### Backup Findings

- Existing pulled backup files at one stage were found to contain empty snapshots.
- This established that some earlier loss cases were caused by stale or low-value backup content rather than restore logic alone.
- Backup strategy was hardened afterward to reduce the chance of blank latest backups replacing useful state.

### Startup And Setup Failures

- Repeated setup failures were eventually traced to startup-path instability.
- One important race involved setup actions interacting badly with late initialization.
- A later critical blocker was a missing `nativeBackupCatalog` declaration in `app/scripts/main.js`.
- That missing variable caused initial render failure before setup handlers were fully bound, which matched the observed behavior:
  - `Upload Logo` doing nothing
  - `Save and Enter` falling back to default form refresh
- That blocker was fixed and the app was rebuilt and reinstalled.

### Repository Hygiene

- The codebase was synchronized to GitHub.
- Local device backup JSONs were explicitly excluded from source control through `.gitignore`.

## Current Use Of This Log

Use this file when future sessions need to answer:

- what major bugs already happened
- what fixes were already attempted
- which failures were device-specific
- which areas of the app have been unstable historically
