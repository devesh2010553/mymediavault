package com.mymediavault.app.network

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

data class PairRequest(val code: String, val deviceInfo: DeviceInfo)
data class DeviceInfo(val name: String, val androidVersion: String, val model: String, val manufacturer: String)
data class PairResponse(val deviceId: String, val deviceToken: String)

data class HeartbeatRequest(val batteryLevel: Int?)

data class CommandDto(
    val _id: String,
    val type: String,
    val mediaIds: List<String>,
    val status: String
)
data class CommandsResponse(val commands: List<CommandDto>)
data class CommandResultRequest(val status: String, val result: Map<String, Any>? = null)

data class UploadResponse(val item: Map<String, Any>, val deduped: Boolean)

interface ApiService {

    @POST("devices/register")
    suspend fun pairDevice(@Body body: PairRequest): Response<PairResponse>

    @POST("devices/{id}/heartbeat")
    suspend fun sendHeartbeat(@Path("id") deviceId: String, @Body body: HeartbeatRequest): Response<Unit>

    @Multipart
    @POST("media/upload")
    suspend fun uploadMedia(
        @Part file: MultipartBody.Part,
        @Part("filename") filename: RequestBody,
        @Part("mimeType") mimeType: RequestBody,
        @Part("mediaType") mediaType: RequestBody,
        @Part("width") width: RequestBody?,
        @Part("height") height: RequestBody?,
        @Part("duration") duration: RequestBody?,
        @Part("createdAt") createdAt: RequestBody?,
        @Part("modifiedAt") modifiedAt: RequestBody?,
        @Part("androidMediaId") androidMediaId: RequestBody
    ): Response<UploadResponse>

    @GET("commands/device/{id}")
    suspend fun getPendingCommands(@Path("id") deviceId: String): Response<CommandsResponse>

    @POST("commands/{id}/result")
    suspend fun reportCommandResult(@Path("id") commandId: String, @Body body: CommandResultRequest): Response<Unit>
}
