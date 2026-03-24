package com.boneandbilling.pos;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class ScheduledBackupWorker extends Worker {
    public ScheduledBackupWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            BackupStorage.writeLatestBackupFromCache(getApplicationContext());
            return Result.success();
        } catch (Exception error) {
            return Result.retry();
        }
    }
}
