# Contributing

## Workflow

1. Create a feature branch from `main`.
2. Keep changes focused and easy to review.
3. Verify web-side syntax before pushing.
4. If UI or logic changes affect Android, sync bundled assets and rebuild the Android shell.
5. Open a pull request with a short summary, verification notes, and device/browser coverage.

## Local Verification

Run JavaScript syntax checks:

```powershell
node --check .\app\scripts\main.js
node --check .\app\scripts\ui\render.js
node --check .\app\scripts\state\store.js
node --check .\app\scripts\data\repository.js
node --check .\app\scripts\domain\billing.js
```

Sync web assets into the Android shell:

```powershell
powershell -ExecutionPolicy Bypass -File .\sync-web-assets.ps1
```

Build the Android app:

```powershell
.\android-shell\gradlew.bat -p .\android-shell :app:assembleDebug --no-daemon
```

## Contribution Rules

- Preserve the local-first architecture unless a larger product decision is made.
- Do not introduce a server dependency casually.
- Keep Android shell changes aligned with the web app behavior.
- Treat data safety as a high-priority concern.
- Test mobile layouts on real devices when touching floor, drawer, settings, or analytics UX.

## Pull Request Notes

A good PR should include:

- what changed
- why it changed
- how it was tested
- screenshots for visible UI changes when possible
- any migration or risk notes
