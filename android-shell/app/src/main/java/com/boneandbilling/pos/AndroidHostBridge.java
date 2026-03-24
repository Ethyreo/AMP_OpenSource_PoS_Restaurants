package com.boneandbilling.pos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class AndroidHostBridge {
    private final Activity activity;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private static final UUID PRINTER_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    public AndroidHostBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void printReceipt(String html, String title) {
        mainHandler.post(() -> {
            String wrappedHtml = "<!DOCTYPE html><html><head>"
                + "<meta charset=\"utf-8\" />"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
                + "<style>body { font-family: monospace; background: white; color: black; margin: 0; padding: 16px; }"
                + ".receipt-sheet { width: 80mm; margin: 0 auto; }"
                + ".receipt-divider { border-top: 1px dashed #333; margin: 12px 0; }"
                + ".receipt-row { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }"
                + ".receipt-items { display: grid; gap: 6px; }"
                + "h2, p { text-align: center; margin: 4px 0; }</style></head><body>"
                + html + "</body></html>";
            WebView printWebView = new WebView(activity);
            printWebView.getSettings().setJavaScriptEnabled(false);
            printWebView.getSettings().setDomStorageEnabled(false);
            printWebView.getSettings().setAllowFileAccess(false);
            printWebView.getSettings().setAllowContentAccess(false);
            printWebView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    PrintManager printManager = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
                    String jobName = (title == null || title.trim().isEmpty()) ? "AMP PoS Receipt" : title;
                    android.print.PrintDocumentAdapter adapter = Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
                        ? printWebView.createPrintDocumentAdapter(jobName)
                        : printWebView.createPrintDocumentAdapter();
                    printManager.print(jobName, adapter, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.UNKNOWN_PORTRAIT).build());
                }
            });
            printWebView.loadDataWithBaseURL("https://appassets.androidplatform.net/", wrappedHtml, "text/html", "utf-8", null);
        });
    }

    @JavascriptInterface
    public String saveExternalBackup(String content, String filename) {
        try {
            BackupStorage.cacheSnapshot(activity, content);
            BackupStorage.writeExternalBackup(activity, content, filename);
            BackupScheduler.schedule(activity.getApplicationContext());
            return "Backup saved to Downloads/KenPoS.";
        } catch (Exception error) {
            return "Backup failed: " + (error.getMessage() == null ? "Unknown storage error." : error.getMessage());
        }
    }

    @JavascriptInterface
    public String cacheBackupSnapshot(String content) {
        try {
            BackupStorage.cacheSnapshot(activity, content);
            BackupScheduler.schedule(activity.getApplicationContext());
            return "Backup cache refreshed for scheduled recovery.";
        } catch (Exception error) {
            return "Backup cache failed: " + (error.getMessage() == null ? "Unknown cache error." : error.getMessage());
        }
    }

    @JavascriptInterface
    public String getLastNativeBackupAt() {
        return BackupStorage.getLastBackupAt(activity);
    }

    @JavascriptInterface
    public String listBackupCatalog() {
        try {
            JSONObject payload = new JSONObject();
            payload.put("status", "ok");
            payload.put("message", "Backups listed from Downloads/KenPoS.");
            payload.put("backups", BackupStorage.listExternalBackups(activity));
            return payload.toString();
        } catch (Exception error) {
            try {
                JSONObject payload = new JSONObject();
                payload.put("status", "error");
                payload.put("message", error.getMessage() == null ? "Unable to list backups." : error.getMessage());
                payload.put("backups", new JSONArray());
                return payload.toString();
            } catch (Exception ignored) {
                return "{\"status\":\"error\",\"message\":\"Unable to list backups.\",\"backups\":[]}";
            }
        }
    }

    @JavascriptInterface
    public String importLatestBackup() {
        return buildImportPayload("Latest automatic backup loaded from Downloads/KenPoS.", BackupStorage.AUTOMATIC_FILENAME, true);
    }

    @JavascriptInterface
    public String importBackupByName(String filename) {
        return buildImportPayload("Backup loaded from Downloads/KenPoS.", filename, false);
    }

    private String buildImportPayload(String successMessage, String filename, boolean latest) {
        try {
            String content = latest ? BackupStorage.readLatestExternalBackup(activity) : BackupStorage.readExternalBackup(activity, filename);
            JSONObject payload = new JSONObject();
            if (content == null || content.trim().isEmpty()) {
                payload.put("status", "missing");
                payload.put("message", latest ? "No automatic backup file was found in Downloads/KenPoS." : "The selected backup file could not be found in Downloads/KenPoS.");
                payload.put("content", "");
                return payload.toString();
            }
            payload.put("status", "ok");
            payload.put("message", successMessage);
            payload.put("content", content);
            return payload.toString();
        } catch (Exception error) {
            try {
                JSONObject payload = new JSONObject();
                payload.put("status", "error");
                payload.put("message", error.getMessage() == null ? "Unable to read the requested backup." : error.getMessage());
                payload.put("content", "");
                return payload.toString();
            } catch (Exception ignored) {
                return "{\"status\":\"error\",\"message\":\"Unable to read the requested backup.\",\"content\":\"\"}";
            }
        }
    }

    @JavascriptInterface
    public String requestLogoImagePicker() {
        if (activity instanceof MainActivity) {
            activity.runOnUiThread(() -> ((MainActivity) activity).openLogoPicker());
            return "Choose a restaurant logo from this device.";
        }
        return "Logo picker is unavailable on this device.";
    }

    @JavascriptInterface
    public String syncBrandedShortcut(String name, String logoDataUrl) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return "Branded shortcut requires Android 8 or newer.";
        try {
            byte[] bitmapBytes = decodeDataUrl(logoDataUrl);
            if (bitmapBytes == null) return "Shortcut update skipped because the restaurant logo is invalid.";
            Bitmap bitmap = BitmapFactory.decodeByteArray(bitmapBytes, 0, bitmapBytes.length);
            if (bitmap == null) return "Shortcut update skipped because the restaurant logo could not be decoded.";
            ShortcutManager shortcutManager = activity.getSystemService(ShortcutManager.class);
            if (shortcutManager == null) return "Shortcut manager is not available on this device.";
            Intent launchIntent = new Intent(activity, MainActivity.class);
            launchIntent.setAction(Intent.ACTION_VIEW);
            ShortcutInfo shortcut = new ShortcutInfo.Builder(activity, "restaurant-pos-brand")
                .setShortLabel((name == null || name.trim().isEmpty()) ? "AMP POS" : name.substring(0, Math.min(name.length(), 10)))
                .setLongLabel(name + " PoS")
                .setIcon(Icon.createWithBitmap(bitmap))
                .setIntent(launchIntent)
                .build();
            shortcutManager.setDynamicShortcuts(java.util.Collections.singletonList(shortcut));
            shortcutManager.updateShortcuts(java.util.Collections.singletonList(shortcut));
            boolean alreadyRequested = activity.getSharedPreferences(BackupStorage.PREFS_NAME, Context.MODE_PRIVATE).getBoolean("brand_shortcut_requested", false);
            if (!alreadyRequested && shortcutManager.isRequestPinShortcutSupported()) {
                shortcutManager.requestPinShortcut(shortcut, null);
                activity.getSharedPreferences(BackupStorage.PREFS_NAME, Context.MODE_PRIVATE).edit().putBoolean("brand_shortcut_requested", true).apply();
                return "Branded home shortcut created or updated from the restaurant logo.";
            }
            return "Branded home shortcut updated from the restaurant logo.";
        } catch (Exception error) {
            return "Shortcut update failed: " + (error.getMessage() == null ? "Unknown shortcut error." : error.getMessage());
        }
    }

    @JavascriptInterface
    public String listPairedBluetoothPrinters() {
        JSONObject payload = new JSONObject();
        try {
            if (!ensureBluetoothPermission()) {
                payload.put("status", "permission-requested");
                payload.put("message", "Bluetooth permission requested. Tap refresh again after granting it.");
                payload.put("printers", new JSONArray());
                return payload.toString();
            }
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
            if (adapter == null) {
                payload.put("status", "unsupported");
                payload.put("message", "This device does not support Bluetooth.");
                payload.put("printers", new JSONArray());
                return payload.toString();
            }
            if (!adapter.isEnabled()) {
                payload.put("status", "disabled");
                payload.put("message", "Bluetooth is off. Turn it on in Android settings, then refresh again.");
                payload.put("printers", new JSONArray());
                return payload.toString();
            }
            JSONArray printers = new JSONArray();
            for (BluetoothDevice device : adapter.getBondedDevices()) {
                JSONObject printer = new JSONObject();
                printer.put("name", device.getName() == null ? "Unnamed Printer" : device.getName());
                printer.put("address", device.getAddress() == null ? "" : device.getAddress());
                printers.put(printer);
            }
            payload.put("status", "ok");
            payload.put("message", printers.length() > 0 ? "Paired Bluetooth printers loaded from Android." : "No paired Bluetooth printers found. Pair the printer in Android settings first.");
            payload.put("printers", printers);
        } catch (Exception error) {
            try {
                payload.put("status", "error");
                payload.put("message", error.getMessage() == null ? "Unable to read paired Bluetooth printers." : error.getMessage());
                payload.put("printers", new JSONArray());
            } catch (Exception ignored) {
                return "{\"status\":\"error\",\"message\":\"Unable to read paired Bluetooth printers.\",\"printers\":[]}";
            }
        }
        return payload.toString();
    }

    @SuppressLint("MissingPermission")
    @JavascriptInterface
    public String printBluetoothReceipt(String text, String printerAddress) {
        if (printerAddress == null || printerAddress.trim().isEmpty()) return "Select a Bluetooth printer in Settings before sending a receipt.";
        if (!ensureBluetoothPermission()) return "Bluetooth permission requested. Tap print again after granting it.";
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) return "This device does not support Bluetooth.";
        if (!adapter.isEnabled()) return "Bluetooth is off. Turn it on in Android settings, then try again.";
        try {
            BluetoothDevice targetDevice = null;
            for (BluetoothDevice device : adapter.getBondedDevices()) {
                if (printerAddress.equals(device.getAddress())) {
                    targetDevice = device;
                    break;
                }
            }
            if (targetDevice == null) return "The selected Bluetooth printer is no longer paired with this device.";
            adapter.cancelDiscovery();
            try (BluetoothSocket socket = targetDevice.createRfcommSocketToServiceRecord(PRINTER_UUID)) {
                socket.connect();
                try (OutputStream output = socket.getOutputStream()) {
                    output.write(text.getBytes(StandardCharsets.UTF_8));
                    output.write(new byte[] {0x0A, 0x0A, 0x0A});
                    output.flush();
                }
            }
            return "Receipt sent to " + (targetDevice.getName() == null ? printerAddress : targetDevice.getName()) + ".";
        } catch (IOException error) {
            return "Bluetooth print failed: " + (error.getMessage() == null ? "Unable to reach the printer." : error.getMessage());
        }
    }

    private boolean ensureBluetoothPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        boolean granted = ContextCompat.checkSelfPermission(activity, Manifest.permission.BLUETOOTH_CONNECT) == android.content.pm.PackageManager.PERMISSION_GRANTED;
        if (granted) return true;
        activity.runOnUiThread(() -> ActivityCompat.requestPermissions(activity, new String[] {Manifest.permission.BLUETOOTH_CONNECT}, 3201));
        return false;
    }

    private byte[] decodeDataUrl(String dataUrl) {
        int index = dataUrl.indexOf(',');
        if (index < 0) return null;
        return Base64.decode(dataUrl.substring(index + 1), Base64.DEFAULT);
    }
}




