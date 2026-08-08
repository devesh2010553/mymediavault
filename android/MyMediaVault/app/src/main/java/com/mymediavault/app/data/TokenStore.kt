package com.mymediavault.app.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.runBlocking

// Stores the device credential issued during pairing in Android's
// EncryptedSharedPreferences (backed by the Keystore) — never plain prefs,
// and never the admin's own website password.
class TokenStore(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "mmv_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveDeviceCredentials(deviceId: String, token: String) {
        prefs.edit()
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_DEVICE_TOKEN, token)
            .apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    fun getDeviceId(): String? = prefs.getString(KEY_DEVICE_ID, null)

    fun getDeviceTokenBlocking(): String? = prefs.getString(KEY_DEVICE_TOKEN, null)

    fun isPaired(): Boolean = getDeviceId() != null && getDeviceTokenBlocking() != null

    companion object {
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_TOKEN = "device_token"
    }
}
