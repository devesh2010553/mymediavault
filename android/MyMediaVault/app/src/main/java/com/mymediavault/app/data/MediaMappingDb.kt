package com.mymediavault.app.data

import android.content.Context
import androidx.room.*

/**
 * Local mapping of server-side Media._id -> the Android content Uri it came
 * from. Populated at upload time (see UploadWorker) and consulted when a
 * remote DELETE_PHONE_MEDIA command arrives, since the server only ever
 * knows its own _id, never the phone's content Uri.
 */
@Entity(tableName = "media_mapping")
data class MediaMappingEntity(
    @PrimaryKey val serverMediaId: String,
    val androidMediaId: String,
    val uriString: String,
    val mediaType: String
)

@Dao
interface MediaMappingDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: MediaMappingEntity)

    @Query("SELECT * FROM media_mapping WHERE serverMediaId IN (:serverMediaIds)")
    suspend fun findByServerIds(serverMediaIds: List<String>): List<MediaMappingEntity>

    @Query("DELETE FROM media_mapping WHERE serverMediaId = :serverMediaId")
    suspend fun deleteByServerId(serverMediaId: String)
}

@Database(entities = [MediaMappingEntity::class], version = 1, exportSchema = false)
abstract class MediaMappingDatabase : RoomDatabase() {
    abstract fun mediaMappingDao(): MediaMappingDao

    companion object {
        @Volatile private var instance: MediaMappingDatabase? = null

        fun get(context: Context): MediaMappingDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    MediaMappingDatabase::class.java,
                    "mmv_media_mapping.db"
                ).build().also { instance = it }
            }
        }
    }
}
