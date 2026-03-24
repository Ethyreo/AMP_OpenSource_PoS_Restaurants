package com.boneandbilling.pos;

import android.content.Context;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

public final class BackupScheduler {
    private static final String UNIQUE_WORK_NAME = "ken-pos-daily-backup";

    private BackupScheduler() {}

    public static void schedule(Context context) {
        Constraints constraints = new Constraints.Builder()
            .setRequiresStorageNotLow(true)
            .build();

        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(ScheduledBackupWorker.class, 24, TimeUnit.HOURS)
            .setConstraints(constraints)
            .build();

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(UNIQUE_WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request);
    }
}
