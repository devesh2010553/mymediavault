package com.mymediavault.app.ui

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.mymediavault.app.data.TokenStore
import com.mymediavault.app.databinding.ActivityPairingBinding
import com.mymediavault.app.network.ApiClient
import com.mymediavault.app.network.DeviceInfo
import com.mymediavault.app.network.PairRequest
import kotlinx.coroutines.launch

class PairingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPairingBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPairingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.pairButton.setOnClickListener {
            val code = binding.codeInput.text?.toString()?.trim().orEmpty()
            if (code.length != 6) {
                binding.statusText.text = "Enter the 6-digit code shown on the website"
                return@setOnClickListener
            }
            pair(code)
        }
    }

    private fun pair(code: String) {
        binding.pairButton.isEnabled = false
        binding.statusText.text = "Pairing..."

        lifecycleScope.launch {
            try {
                val api = ApiClient.get(applicationContext)
                val deviceInfo = DeviceInfo(
                    name = "${Build.MANUFACTURER} ${Build.MODEL}",
                    androidVersion = Build.VERSION.RELEASE ?: "unknown",
                    model = Build.MODEL ?: "unknown",
                    manufacturer = Build.MANUFACTURER ?: "unknown"
                )
                val response = api.pairDevice(PairRequest(code = code, deviceInfo = deviceInfo))

                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    TokenStore(applicationContext).saveDeviceCredentials(body.deviceId, body.deviceToken)
                    startActivity(Intent(this@PairingActivity, PermissionsActivity::class.java))
                    finish()
                } else {
                    binding.statusText.text = "Pairing failed — the code may be wrong or expired"
                    binding.pairButton.isEnabled = true
                }
            } catch (e: Exception) {
                binding.statusText.text = "Network error: ${e.message}"
                binding.pairButton.isEnabled = true
            }
        }
    }
}
