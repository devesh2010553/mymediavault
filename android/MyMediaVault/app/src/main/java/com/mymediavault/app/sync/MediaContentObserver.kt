package com.mymediavault.app.sync

import android.content.Context
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import androidx.work.*
import java.util.concurrent.TimeUnit

// Watches MediaStore for new photos/videos and enqueues an upload pass.
// Debounced with a short delay via WorkManager's unique-work replace
// policy so a burst of new files (e.g. a camera roll import) doesn't
// spawn dozens of overlapping workers.
class MediaContentObserver(private val context: Context) : ContentObserver(Handler(Looper.getMainLooper())) {

    override fun onChange(selfChange: Boolean) {
        super.onChange(selfChange)
        SyncScheduler.enqueueUploadOnce(context, delaySeconds = 15)
    }
}

object SyncScheduler {

    private const val UPLOAD_WORK_NAME = "mmv_upload_work"
    private const val PERIODIC_WORK_NAME = "mmv_periodic_sync"
    private const val COMMAND_POLL_WORK_NAME = "mmv_command_poll"

    fun enqueueUploadOnce(context: Context, delaySeconds: Long = 0, wifiOnly: Boolean = true, chargingOnly: Boolean = false) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED)
            .setRequiresCharging(chargingOnly)
            .build()

        val request = OneTimeWorkRequestBuilder<UploadWorker>()
            .setConstraints(constraints)
            .setInitialDelay(delaySeconds, TimeUnit.SECONDS)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, WorkRequest.MIN_BACKOFF_MILLIS, TimeUnit.MILLISECONDS)
            .build()

        WorkManager.getInstance(context)
            .enqueueUniqueWork(UPLOAD_WORK_NAME, ExistingWorkPolicy.REPLACE, request)
    }

    fun schedulePeriodicSync(context: Context, wifiOnly: Boolean = true, chargingOnly: Boolean = false) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED)
            .setRequiresCharging(chargingOnly)
            .build()

        val request = PeriodicWorkRequestBuilder<UploadWorker>(30, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(PERIODIC_WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request)
    }

    fun schedulePeriodicCommandPoll(context: Context) {
        val request = PeriodicWorkRequestBuilder<CommandPollWorker>(15, TimeUnit.MINUTES)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(COMMAND_POLL_WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request)
    }
}
