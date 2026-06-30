package com.nader.gradesapp.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

class SettingsStore(private val context: Context) {
    companion object {
        val WORKER_URL = stringPreferencesKey("worker_url")
    }

    val workerUrl = context.dataStore.data.map { it[WORKER_URL] }

    suspend fun saveWorkerUrl(url: String) {
        context.dataStore.edit { it[WORKER_URL] = url }
    }

    suspend fun clearWorkerUrl() {
        context.dataStore.edit { it.remove(WORKER_URL) }
    }
}
