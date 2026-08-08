package com.mymediavault.app.data

import android.content.Context
import android.provider.MediaStore
import java.security.MessageDigest

data class ScannedMedia(
    val androidMediaId: String,
    val uriString: String,
    val filename: String,
    val mimeType: String,
    val mediaType: String, // "photo" | "video"
    val size: Long,
    val width: Int?,
    val height: Int?,
    val durationMs: Long?,
    val dateAdded: Long,
    val dateModified: Long
)

// Reads media strictly through Android's official MediaStore APIs — only
// the items the OS actually grants this app access to (all media, or
// selected-media only on Android 14+ photo picker grants).
class MediaScanner(private val context: Context) {

    fun scanImages(): List<ScannedMedia> = scan(
        collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
        mediaType = "photo"
    )

    fun scanVideos(): List<ScannedMedia> = scan(
        collection = MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
        mediaType = "video"
    )

    private fun scan(collection: android.net.Uri, mediaType: String): List<ScannedMedia> {
        val results = mutableListOf<ScannedMedia>()

        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.WIDTH,
            MediaStore.MediaColumns.HEIGHT,
            MediaStore.MediaColumns.DATE_ADDED,
            MediaStore.MediaColumns.DATE_MODIFIED,
        )

        context.contentResolver.query(collection, projection, null, null, null)?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
            val nameCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
            val mimeCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.MIME_TYPE)
            val sizeCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.SIZE)
            val widthCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.WIDTH)
            val heightCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.HEIGHT)
            val addedCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED)
            val modifiedCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_MODIFIED)

            while (cursor.moveToNext()) {
                val id = cursor.getLong(idCol)
                val uri = android.content.ContentUris.withAppendedId(collection, id)
                results.add(
                    ScannedMedia(
                        androidMediaId = id.toString(),
                        uriString = uri.toString(),
                        filename = cursor.getString(nameCol) ?: "unknown",
                        mimeType = cursor.getString(mimeCol) ?: "application/octet-stream",
                        mediaType = mediaType,
                        size = cursor.getLong(sizeCol),
                        width = cursor.getIntOrNull(widthCol),
                        height = cursor.getIntOrNull(heightCol),
                        durationMs = null, // filled in separately for videos if needed via MediaMetadataRetriever
                        dateAdded = cursor.getLong(addedCol) * 1000,
                        dateModified = cursor.getLong(modifiedCol) * 1000
                    )
                )
            }
        }

        return results
    }

    private fun android.database.Cursor.getIntOrNull(col: Int): Int? =
        if (isNull(col)) null else getInt(col)

    companion object {
        fun sha256(bytes: ByteArray): String {
            val digest = MessageDigest.getInstance("SHA-256").digest(bytes)
            return digest.joinToString("") { "%02x".format(it) }
        }
    }
}
