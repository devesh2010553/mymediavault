package com.mymediavault.app.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.mymediavault.app.data.MediaMappingDatabase
import com.mymediavault.app.data.MediaMappingEntity
import com.mymediavault.app.data.MediaScanner
import com.mymediavault.app.data.TokenStore
import com.mymediavault.app.network.ApiClient
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

/**
 * Scans MediaStore (within whatever access Android has granted) and
 * uploads anything not yet backed up. Runs via WorkManager so the OS can
 * schedule/retry it under Doze and battery restrictions — this worker
 * never assumes guaranteed background execution, only that Android will
 * eventually run it again per the configured constraints.
 */
class UploadWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val tokenStore = TokenStore(applicationContext)
        val deviceId = tokenStore.getDeviceId() ?: return Result.failure()

        val api = ApiClient.get(applicationContext)
        val scanner = MediaScanner(applicationContext)

        val allItems = scanner.scanImages() + scanner.scanVideos()
        var failures = 0

        for (item in allItems) {
            try {
                val resolver = applicationContext.contentResolver
                val tempFile = File.createTempFile("mmv_upload", null, applicationContext.cacheDir)
                resolver.openInputStream(android.net.Uri.parse(item.uriString))?.use { input ->
                    tempFile.outputStream().use { output -> input.copyTo(output) }
                } ?: continue

                val mediaTypeHeader = item.mimeType.toMediaTypeOrNull()
                val filePart = MultipartBody.Part.createFormData(
                    "file", item.filename, tempFile.asRequestBody(mediaTypeHeader)
                )

                val response = api.uploadMedia(
                    file = filePart,
                    filename = item.filename.toRequestBody("text/plain".toMediaTypeOrNull()),
                    mimeType = item.mimeType.toRequestBody("text/plain".toMediaTypeOrNull()),
                    mediaType = item.mediaType.toRequestBody("text/plain".toMediaTypeOrNull()),
                    width = item.width?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull()),
                    height = item.height?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull()),
                    duration = item.durationMs?.let { (it / 1000.0).toString() }?.toRequestBody("text/plain".toMediaTypeOrNull()),
                    createdAt = item.dateAdded.toString().toRequestBody("text/plain".toMediaTypeOrNull()),
                    modifiedAt = item.dateModified.toString().toRequestBody("text/plain".toMediaTypeOrNull()),
                    androidMediaId = item.androidMediaId.toRequestBody("text/plain".toMediaTypeOrNull())
                )

                tempFile.delete()

                if (response.isSuccessful) {
                    val serverId = response.body()?.item?.get("_id") as? String
                    if (serverId != null) {
                        MediaMappingDatabase.get(applicationContext).mediaMappingDao().upsert(
                            MediaMappingEntity(
                                serverMediaId = serverId,
                                androidMediaId = item.androidMediaId,
                                uriString = item.uriString,
                                mediaType = item.mediaType
                            )
                        )
                    }
                } else {
                    failures++
                }
            } catch (e: Exception) {
                failures++
            }
        }

        return if (failures == 0) Result.success() else Result.retry()
    }
}
