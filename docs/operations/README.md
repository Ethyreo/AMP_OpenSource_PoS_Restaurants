# Operations Checklist

This file is the working checklist. For the broader historical log, read SESSION-LOG.md in the same folder.

## Completed
- [x] Rename app to `AMP Restaurant POS` across web shell, Android label, manifest, and receipt defaults.
- [x] Change launch attribution to `Built by Gurman Singh for`.
- [x] Add floor view toggle between detailed table cards and compact square table cards.
- [x] Make new dish category selection use the categories that already exist in the menu.
- [x] Convert the in-table drawer into two tabs: `Menu` and `Current Bill`.
- [x] Fix compact menu overlap and tint compact food cards by type while keeping the luxury visual style.
- [x] Add local category management in Settings with guarded delete rules for non-empty categories.
- [x] Move the dish editor into a dedicated modal window instead of keeping it inline at the bottom of Settings.
- [x] Remove the top hero search/print action bar and replace it with `AMP x {Restaurant name}`.
- [x] Move quick search into the in-table menu workspace.

## Pending Verification On Device
- [ ] Install this latest build on the phone.
- [ ] Verify compact menu cards render cleanly for both veg and non-veg dishes.
- [ ] Verify category add/delete flows work correctly and block deletion when dishes still use the category.
- [ ] Verify the new dish modal opens, edits, saves, and closes correctly on a real device.
- [ ] Verify the new `AMP x {Restaurant name}` header appears correctly on all tabs.

## Install Note
- The latest APK is built successfully.
- Direct update install is currently blocked by Android because the app already on the phone was signed with a different key: `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.
- To install this build on the phone, the existing `com.boneandbilling.pos` app must be removed first.
