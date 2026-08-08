package com.mymediavault.app.ui

import android.app.PendingIntent
import android.content.ContentUris
import android.content.Intent
import android.content.IntentSender
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.mymediavault.app.data.MediaMappingDatabase
import com.mymediavault.app.data.MediaScanner
import com.mymediavault.app.data.TokenStore
import com.mymediavault.app.databinding.ActivityMainBinding
import com.mymediavault.app.network.ApiClient
import com.mymediavault.app.network.CommandResultRequest
import com.mymediavault.app.sync.PendingCommandRelay
import com.mymediavault.app.sync.SyncScheduler
import kotlinx.coroutines.launch

// Simple home screen matching the spec: connection status, photo/video
// counts, last sync, backup toggle. Deletion confirmations that require a
// system dialog (Android 11+) are handled here since they need an Activity.
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var tokenStore: TokenStore

    private var pendingDeleteCommandId: String? = null
    private var pendingDeleteMediaIds: List<String> = emptyList()

    private val deleteRequestLauncher = registerForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        lifecycleScope.launch {
            val api = ApiClient.get(applicationContext)
            val commandId = pendingDeleteCommandId ?: return@launch
            val status = if (result.resultCode == RESULT_OK) "completed" else "failed"
            api.reportCommandResult(commandId, CommandResultRequest(status = status))

            if (status == "completed") {
                val dao = MediaMappingDatabase.get(applicationContext).mediaMappingDao()
                pendingDeleteMediaIds.forEach { dao.deleteByServerId(it) }
            }
            pendingDeleteCommandId = null
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenStore = TokenStore(applicationContext)

        if (!tokenStore.isPaired()) {
            startActivity(Intent(this, PairingActivity::class.java))
            finish()
            return
        }

        PendingCommandRelay.observe { commandId, mediaIds ->
            runOnUiThread { handleDeleteRequested(commandId, mediaIds) }
        }

        binding.syncNowButton.setOnClickListener {
            SyncScheduler.enqueueUploadOnce(applicationContext, wifiOnly = false)
        }

        refreshCounts()
    }

    private fun refreshCounts() {
        lifecycleScope.launch {
            val scanner = MediaScanner(applicationContext)
            val photos = scanner.scanImages().size
            val videos = scanner.scanVideos().size

            binding.connectionStatus.text = "● Connected"
            binding.photoCount.text = photos.toString()
            binding.videoCount.text = videos.toString()
            binding.deviceName.text = android.os.Build.MODEL
        }
    }

    // Requires a system confirmation dialog on Android 11+ via
    // MediaStore.createDeleteRequest — this is the officially supported
    // mechanism and is never bypassed. Server media _ids are resolved back
    // to Android content URIs via the local Room-backed mapping table that
    // UploadWorker populates at upload time.
    private fun handleDeleteRequested(commandId: String, mediaIds: List<String>) {
        pendingDeleteCommandId = commandId
        pendingDeleteMediaIds = mediaIds

        lifecycleScope.launch {
            val dao = MediaMappingDatabase.get(applicationContext).mediaMappingDao()
            val mappings = dao.findByServerIds(mediaIds)
            val uris: List<Uri> = mappings.map { Uri.parse(it.uriString) }

            if (uris.isEmpty()) {
                // We have no local record of these files (already deleted, or
                // uploaded by a previous install) — nothing to confirm.
                ApiClient.get(applicationContext).reportCommandResult(
                    commandId, CommandResultRequest(status = "failed")
                )
                pendingDeleteCommandId = null
                return@launch
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val pendingIntent: PendingIntent = MediaStore.createDeleteRequest(contentResolver, uris)
                val request = IntentSenderRequest.Builder(pendingIntent.intentSender).build()
                deleteRequestLauncher.launch(request)
            } else {
                // Pre-Android 11: delete directly through MediaStore, which may
                // still prompt via a RecoverableSecurityException that must be
                // caught and resolved with startIntentSenderForResult.
                try {
                    uris.forEach { contentResolver.delete(it, null, null) }
                    mediaIds.forEach { dao.deleteByServerId(it) }
                    ApiClient.get(applicationContext).reportCommandResult(
                        commandId, CommandResultRequest(status = "completed")
                    )
                } catch (e: Exception) {
                    ApiClient.get(applicationContext).reportCommandResult(
                        commandId, CommandResultRequest(status = "failed")
                    )
                }
                pendingDeleteCommandId = null
            }
        }
    }
}
