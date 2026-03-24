# Restaurant POS Android

Local-first restaurant PoS app for Android-targeted devices. The product core is a self-contained web app with IndexedDB persistence, browser-side billing, and print-ready receipts. A matching Android Studio shell is included so the same app can run as an installable local Android app with no backend.

## What Is Implemented

- Cred-style visual shell with sober pastel tokens, soft depth, and spacious table cards
- Floor view with urgency-aware table states and filters
- Long-press table move flow for active orders
- Searchable seeded menu with veg and non-veg accents
- Slide-out order drawer with live billing summary
- Local billing engine with editable GST and service charge settings
- IndexedDB persistence for table drafts, settings, and bill history
- Local backup export and restore hooks for workstation state
- End-of-day summary with revenue, top items, and payment splits
- Receipt print area for browser printing and native Android print bridge support
- Android Studio shell in `android-shell/` using WebView asset loading from bundled local files

## Web App Usage

- You can open `index.html` directly for a simple local run.
- IndexedDB works best in a normal browser context.
- Service worker support only applies when served over HTTP.

Optional local static serving:

1. Open a terminal in this folder.
2. Run `npm run serve`.
3. Open `http://localhost:4173`.

## Android Studio Usage

1. Open `android-shell/` in Android Studio.
2. Sync the Gradle project.
3. Run the app on an emulator or device.
4. If web assets change, run `powershell -ExecutionPolicy Bypass -File .\sync-web-assets.ps1` from the project root before rebuilding the Android shell.

## Notes

- No server-side app or backend is required for the current implementation.
- The Android shell loads the app from bundled assets, not a remote URL.
- The Android shell currently focuses on local asset loading, IndexedDB-capable WebView runtime, file chooser support, and native printing bridge.
