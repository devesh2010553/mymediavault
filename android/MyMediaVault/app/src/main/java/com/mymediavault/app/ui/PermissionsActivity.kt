package com.mymediavault.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.mymediavault.app.databinding.ActivityPermissionsBinding
import com.mymediavault.app.sync.SyncScheduler

// Requests only the media permissions appropriate for the running Android
// version, and makes clear to the user why they're needed before asking —
// no permission is requested silently or under a misleading pretext.
class PermissionsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPermissionsBinding

    private val requestPermissions = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val granted = results.values.any { it }
        if (granted) {
            SyncScheduler.enqueueUploadOnce(applicationContext)
            SyncScheduler.schedulePeriodicSync(applicationContext)
            SyncScheduler.schedulePeriodicCommandPoll(applicationContext)
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        } else {
            binding.statusText.text = "Permission denied. Backup cannot start until access is granted."
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPermissionsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.explanationText.text =
            "MyMediaVault needs photo and video access so it can back up media from this phone to your private server."

        binding.continueButton.setOnClickListener {
            requestPermissions.launch(requiredPermissions())
        }
    }

    private fun requiredPermissions(): Array<String> {
        return when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> arrayOf(
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VIDEO
            )
            else -> arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    private fun hasAnyMediaAccess(): Boolean =
        requiredPermissions().any {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
}
