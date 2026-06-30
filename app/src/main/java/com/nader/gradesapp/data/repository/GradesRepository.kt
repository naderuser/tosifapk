package com.nader.gradesapp.data.repository

import com.nader.gradesapp.data.model.GradeItem
import com.nader.gradesapp.data.model.SaveRequest
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class GradesRepository(baseUrl: String) {
    companion object {
        const val TEACHER_PASSWORD = "nader0933"
    }

    private val api: ApiService by lazy {
        val client = OkHttpClient.Builder().build()
        Retrofit.Builder()
            .baseUrl(baseUrl.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    suspend fun loadByUUID(uuid: String): Result<Map<String, List<GradeItem>>> {
        return try {
            val r = api.loadGrades(uuid)
            if (r.isSuccessful && r.body()?.success == true)
                Result.success(r.body()!!.data ?: emptyMap())
            else Result.failure(Exception(r.body()?.error ?: "خطا"))
        } catch (e: Exception) { Result.failure(e) }
    }

    suspend fun saveGrades(uuid: String, grades: Map<String, List<GradeItem>>): Result<Boolean> {
        return try {
            val r = api.saveGrades(SaveRequest(uuid, grades))
            if (r.isSuccessful && r.body()?.success == true) Result.success(true)
            else Result.failure(Exception(r.body()?.error ?: "خطا"))
        } catch (e: Exception) { Result.failure(e) }
    }
}
