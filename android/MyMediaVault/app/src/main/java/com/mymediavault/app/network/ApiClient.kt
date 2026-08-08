package com.mymediavault.app.network

import android.content.Context
import com.mymediavault.app.BuildConfig
import com.mymediavault.app.data.TokenStore
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

// Single Retrofit instance for the app. Attaches the device's own bearer
// token (never the admin password) to every request.
object ApiClient {

    @Volatile private var retrofit: Retrofit? = null

    fun get(context: Context): ApiService {
        val instance = retrofit ?: synchronized(this) {
            retrofit ?: build(context).also { retrofit = it }
        }
        return instance.create(ApiService::class.java)
    }

    private fun build(context: Context): Retrofit {
        val tokenStore = TokenStore(context)

        val authInterceptor = Interceptor { chain ->
            val token = tokenStore.getDeviceTokenBlocking()
            val request = chain.request().newBuilder().apply {
                if (!token.isNullOrEmpty()) {
                    addHeader("Authorization", "Bearer $token")
                }
            }.build()
            chain.proceed(request)
        }

        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC else HttpLoggingInterceptor.Level.NONE
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .build()

        return Retrofit.Builder()
            .baseUrl(ensureTrailingSlash(BuildConfig.API_BASE_URL))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    private fun ensureTrailingSlash(url: String) = if (url.endsWith("/")) url else "$url/"
}
