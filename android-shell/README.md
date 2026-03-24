# Android Shell

This Android Studio project packages the local web app into an installable Android shell.

## Runtime Approach

- WebView loads bundled assets through `WebViewAssetLoader`
- IndexedDB and DOM storage are enabled
- File chooser support is enabled for local import flows
- Receipt printing is bridged to Android's native print system

## Important

Whenever the web app changes, re-sync assets from the root project:

`powershell -ExecutionPolicy Bypass -File .\sync-web-assets.ps1`
