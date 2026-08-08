package com.mymediavault.app.sync

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.mymediavault.app.data.TokenStore

// Re-schedules periodic sync/command-poll work after device restart, using
// WorkManager's own persistence — this does not guarantee execution on
// every OS variant with aggressive battery restrictions, only that work
// resumes when Android next permits it.
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val tokenStore = TokenStore(context)
        if (!tokenStore.isPaired()) return

        SyncScheduler.schedulePeriodicSync(context)
        SyncScheduler.schedulePeriodicCommandPoll(context)
    }
}
