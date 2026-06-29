package com.nader.gradesapp.data.model

data class GradeItem(
    val id: String,
    val subject: String,
    val level: String,
    val levelText: String,
    var desc: String
)

data class LoadResponse(
    val success: Boolean,
    val data: Map<String, List<GradeItem>>? = null,
    val error: String? = null
)

data class SaveRequest(
    val uuid: String,
    val grades: Map<String, List<GradeItem>>
)

data class SaveResponse(
    val success: Boolean,
    val error: String? = null
)
