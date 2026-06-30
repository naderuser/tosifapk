package com.nader.gradesapp.data.repository

import com.nader.gradesapp.data.model.GradeItem
import com.nader.gradesapp.data.model.LoadResponse
import com.nader.gradesapp.data.model.SaveRequest
import com.nader.gradesapp.data.model.SaveResponse
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @GET("api/load")
    suspend fun loadGrades(@Query("uuid") uuid: String): Response<LoadResponse>

    @POST("api/save")
    suspend fun saveGrades(@Body body: SaveRequest): Response<SaveResponse>
}
