package com.mymediavault.app.sync

import android.content.Context
import android.provider.MediaStore
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.mymediavault.app.data.TokenStore
import com.mymediavault.app.network.ApiClient
import com.mymediavault.app.network.CommandResultRequest

/**
 * Polls the backend for pending remote commands (e.g. DELETE_PHONE_MEDIA,
 * SYNC_NOW) and executes them using only Android's official, sanctioned
 * mechanisms. On Android 11+, deleting another app's or even this app's
 * media the user didn't directly select through the picker can require a
 * system confirmation (MediaStore.createDeleteRequest); that confirmation
 * is never bypassed.
 */
class CommandPollWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val tokenStore = TokenStore(applicationContext)
        val deviceId = tokenStore.getDeviceId() ?: return Result.failure()
        val api = ApiClient.get(applicationContext)

        val response = api.getPendingCommands(deviceId)
        if (!response.isSuccessful) return Result.retry()

        val commands = response.body()?.commands ?: emptyList()

        for (command in commands) {
            when (command.type) {
                "SYNC_NOW" -> {
                    SyncScheduler.enqueueUploadOnce(applicationContext, delaySeconds = 0)
                    api.reportCommandResult(command._id, CommandResultRequest(status = "completed"))
                }
                "DELETE_PHONE_MEDIA" -> {
                    // Actual deletion is handled by MainActivity via the system
                    // confirmation flow (MediaStore.createDeleteRequest requires
                    // an Activity + startIntentSenderForResult). We surface the
                    // pending command to the UI rather than silently deleting here.
                    PendingCommandRelay.notifyDeleteRequested(command._id, command.mediaIds)
                }
                "REQUEST_DEVICE_STATUS" -> {
                    api.reportCommandResult(command._id, CommandResultRequest(status = "completed"))
                }
                else -> {
                    api.reportCommandResult(command._id, CommandResultRequest(status = "failed"))
                }
            }
        }

        return Result.success()
    }
}

// Simple in-process relay so a background worker can hand off a
// user-confirmation-required action (deletion) to the foreground UI.
object PendingCommandRelay {
    private val listeners = mutableListOf<(String, List<String>) -> Unit>()

    fun notifyDeleteRequested(commandId: String, mediaIds: List<String>) {
        listeners.forEach { it(commandId, mediaIds) }
    }

    fun observe(listener: (String, List<String>) -> Unit) {
        listeners.add(listener)
    }
}
