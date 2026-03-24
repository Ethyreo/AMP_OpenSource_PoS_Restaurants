package com.boneandbilling.pos;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class BackupStorage {
    public static final String PUBLIC_DIRECTORY = "KenPoS";
    public static final String CACHE_DIRECTORY = "backup-cache";
    public static final String CACHE_FILENAME = "ken-pos-backup-cache.json";
    public static final String AUTOMATIC_FILENAME = "ken-pos-backup-latest.json";
    public static final String PREFS_NAME = "ken-pos-native";
    public static final String PREF_LAST_BACKUP_AT = "last_external_backup_at";

    private BackupStorage() {}

    private static final class BackupEntry {
        final String name;
        final long modifiedEpochMillis;
        final long sizeBytes;

        BackupEntry(String name, long modifiedEpochMillis, long sizeBytes) {
            this.name = name;
            this.modifiedEpochMillis = modifiedEpochMillis;
            this.sizeBytes = sizeBytes;
        }
    }

    public static void cacheSnapshot(Context context, String content) throws IOException {
        File directory = new File(context.getFilesDir(), CACHE_DIRECTORY);
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("Unable to create internal backup cache directory.");
        }
        File file = new File(directory, CACHE_FILENAME);
        try (FileOutputStream stream = new FileOutputStream(file, false)) {
            stream.write(content.getBytes(StandardCharsets.UTF_8));
        }
    }

    public static String readCachedSnapshot(Context context) throws IOException {
        File file = new File(new File(context.getFilesDir(), CACHE_DIRECTORY), CACHE_FILENAME);
        if (!file.exists()) {
            return null;
        }
        try (FileInputStream stream = new FileInputStream(file)) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    public static void writeExternalBackup(Context context, String content, String filename) throws IOException {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveBackupWithMediaStore(context, content, filename);
        } else {
            saveBackupLegacy(context, content, filename);
        }
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(PREF_LAST_BACKUP_AT, Instant.now().toString())
            .apply();
    }

    public static String getLastBackupAt(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(PREF_LAST_BACKUP_AT, "");
    }

    public static void writeLatestBackupFromCache(Context context) throws IOException {
        String cached = readCachedSnapshot(context);
        if (cached == null || cached.trim().isEmpty()) {
            return;
        }
        writeExternalBackup(context, cached, AUTOMATIC_FILENAME);
    }

    public static String readLatestExternalBackup(Context context) throws Exception {
        JSONArray catalog = listExternalBackups(context);
        for (int index = 0; index < catalog.length(); index += 1) {
            JSONObject entry = catalog.optJSONObject(index);
            if (entry != null && entry.optBoolean("latest")) {
                return readExternalBackup(context, entry.optString("name"));
            }
        }
        return null;
    }

    public static String readExternalBackup(Context context, String filename) throws IOException {
        if (filename == null || filename.trim().isEmpty()) {
            return null;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return readBackupWithMediaStore(context, filename);
        }
        return readBackupLegacy(filename);
    }

    public static JSONArray listExternalBackups(Context context) throws Exception {
        List<BackupEntry> entries = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
            ? listBackupsWithMediaStore(context)
            : listBackupsLegacy();
        entries.sort(Comparator.comparingLong((BackupEntry entry) -> entry.modifiedEpochMillis).reversed());
        JSONArray payload = new JSONArray();
        for (BackupEntry entry : entries) {
            JSONObject item = new JSONObject();
            item.put("name", entry.name);
            item.put("modifiedAt", Instant.ofEpochMilli(entry.modifiedEpochMillis).toString());
            item.put("sizeBytes", entry.sizeBytes);
            item.put("sizeLabel", formatSize(entry.sizeBytes));
            item.put("latest", entry.name.startsWith("ken-pos-backup-latest"));
            payload.put(item);
        }
        return payload;
    }

    private static String saveBackupPath() {
        return Environment.DIRECTORY_DOWNLOADS + "/" + PUBLIC_DIRECTORY + "/";
    }

    private static boolean isBackupFilename(String name) {
        return name != null && name.startsWith("ken-pos-backup") && name.endsWith(".json");
    }

    private static void saveBackupWithMediaStore(Context context, String content, String filename) throws IOException {
        ContentResolver resolver = context.getContentResolver();
        android.net.Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
        String[] projection = new String[] {MediaStore.Downloads._ID};
        String selection = MediaStore.Downloads.DISPLAY_NAME + "=?";
        String[] selectionArgs = new String[] {filename};
        try (android.database.Cursor cursor = resolver.query(collection, projection, selection, selectionArgs, null)) {
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    long id = cursor.getLong(0);
                    resolver.delete(ContentUris.withAppendedId(collection, id), null, null);
                }
            }
        }

        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
        values.put(MediaStore.Downloads.MIME_TYPE, "application/json");
        values.put(MediaStore.Downloads.RELATIVE_PATH, saveBackupPath());
        android.net.Uri uri = resolver.insert(collection, values);
        if (uri == null) {
            throw new IOException("Unable to create backup file.");
        }
        try (OutputStream output = resolver.openOutputStream(uri, "w")) {
            if (output == null) {
                throw new IOException("Unable to write backup content.");
            }
            output.write(content.getBytes(StandardCharsets.UTF_8));
        }
    }

    private static List<BackupEntry> listBackupsWithMediaStore(Context context) throws IOException {
        List<BackupEntry> entries = new ArrayList<>();
        ContentResolver resolver = context.getContentResolver();
        android.net.Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
        String[] projection = new String[] {
            MediaStore.Downloads.DISPLAY_NAME,
            MediaStore.Downloads.DATE_MODIFIED,
            MediaStore.Downloads.SIZE,
            MediaStore.Downloads.RELATIVE_PATH,
        };
        String selection = MediaStore.Downloads.DISPLAY_NAME + " LIKE ?";
        String[] selectionArgs = new String[] {"ken-pos-backup%"};
        try (android.database.Cursor cursor = resolver.query(collection, projection, selection, selectionArgs, null)) {
            if (cursor == null) {
                return entries;
            }
            while (cursor.moveToNext()) {
                String displayName = cursor.getString(0);
                long modifiedAtSeconds = cursor.getLong(1);
                long sizeBytes = cursor.getLong(2);
                String relativePath = cursor.getString(3);
                if (!isBackupFilename(displayName)) {
                    continue;
                }
                if (relativePath != null && !relativePath.contains(PUBLIC_DIRECTORY)) {
                    continue;
                }
                entries.add(new BackupEntry(displayName, modifiedAtSeconds * 1000L, sizeBytes));
            }
        }
        return entries;
    }

    private static String readBackupWithMediaStore(Context context, String filename) throws IOException {
        ContentResolver resolver = context.getContentResolver();
        android.net.Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
        String[] projection = new String[] {
            MediaStore.Downloads._ID,
            MediaStore.Downloads.DISPLAY_NAME,
            MediaStore.Downloads.RELATIVE_PATH,
        };
        String selection = MediaStore.Downloads.DISPLAY_NAME + " LIKE ?";
        String[] selectionArgs = new String[] {filename};
        try (android.database.Cursor cursor = resolver.query(collection, projection, selection, selectionArgs, null)) {
            if (cursor == null) {
                return null;
            }
            while (cursor.moveToNext()) {
                String displayName = cursor.getString(1);
                String relativePath = cursor.getString(2);
                if (!filename.equals(displayName)) {
                    continue;
                }
                if (relativePath != null && !relativePath.contains(PUBLIC_DIRECTORY)) {
                    continue;
                }
                long id = cursor.getLong(0);
                android.net.Uri uri = ContentUris.withAppendedId(collection, id);
                try (InputStream input = resolver.openInputStream(uri)) {
                    if (input == null) {
                        return null;
                    }
                    return new String(input.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        }
        return null;
    }

    private static List<BackupEntry> listBackupsLegacy() {
        List<BackupEntry> entries = new ArrayList<>();
        File directory = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), PUBLIC_DIRECTORY);
        File[] files = directory.listFiles();
        if (files == null) {
            return entries;
        }
        for (File file : files) {
            if (!file.isFile() || !isBackupFilename(file.getName())) {
                continue;
            }
            entries.add(new BackupEntry(file.getName(), file.lastModified(), file.length()));
        }
        return entries;
    }

    private static String readBackupLegacy(String filename) throws IOException {
        File file = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), PUBLIC_DIRECTORY + "/" + filename);
        if (!file.exists()) {
            return null;
        }
        try (FileInputStream stream = new FileInputStream(file)) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static void saveBackupLegacy(Context context, String content, String filename) throws IOException {
        File directory = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), PUBLIC_DIRECTORY);
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("Unable to create Downloads/KenPoS directory.");
        }
        File file = new File(directory, filename);
        try (FileOutputStream stream = new FileOutputStream(file, false)) {
            stream.write(content.getBytes(StandardCharsets.UTF_8));
        }
        MediaScannerConnection.scanFile(context, new String[] {file.getAbsolutePath()}, new String[] {"application/json"}, null);
    }

    private static String formatSize(long sizeBytes) {
        if (sizeBytes >= 1024 * 1024) {
            return String.format(java.util.Locale.US, "%.1f MB", sizeBytes / (1024f * 1024f));
        }
        if (sizeBytes >= 1024) {
            return String.format(java.util.Locale.US, "%.1f KB", sizeBytes / 1024f);
        }
        return sizeBytes + " B";
    }
}

