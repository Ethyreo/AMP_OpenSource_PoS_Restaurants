package com.boneandbilling.pos;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.media.MediaScannerConnection;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

public final class BackupStorage {
    public static final String PUBLIC_DIRECTORY = "KenPoS";
    public static final String CACHE_DIRECTORY = "backup-cache";
    public static final String CACHE_FILENAME = "ken-pos-backup-cache.json";
    public static final String AUTOMATIC_FILENAME = "ken-pos-backup-latest.json";
    public static final String PREFS_NAME = "ken-pos-native";
    public static final String PREF_LAST_BACKUP_AT = "last_external_backup_at";

    private BackupStorage() {}

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
        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + PUBLIC_DIRECTORY);
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
}

