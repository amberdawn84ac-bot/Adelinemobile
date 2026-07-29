package com.example.data

import android.util.Log
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.coroutines.resume

@Serializable
data class WorkbookExperiment(
    val title: String,
    val materials: List<String>,
    val steps: List<String>,
    val educationalInsight: String
)

@Serializable
data class LessonWorkbook(
    val title: String,
    val gradeLevel: String,
    val subjectArea: String,
    val storyTitle: String,
    val storyContent: String,
    val feynmanExplanation: String,
    val readAloudLecture: String,
    val experiments: List<WorkbookExperiment>,
    val journalPrompts: List<String>,
    val standardsAligned: List<String>,
    val portfolioSummary: String
)

@Serializable
data class CanonicalCurriculum(
    val id: String,
    val title: String,
    val description: String,
    val activities: List<CanonicalActivity>,
    val originalGradeLevel: String = "Any",
    val originalInterests: String = "General",
    val author: String = "Adeline's Brain",
    val timestamp: Long = System.currentTimeMillis(),
    val workbookJson: String? = null
)

@Serializable
data class CanonicalActivity(
    val title: String,
    val creditType: String,
    val description: String
)

object FirestoreCurriculumService {
    private const val TAG = "FirestoreCurriculum"
    private const val COLLECTION_NAME = "canonical_curriculums"

    private val db: FirebaseFirestore? by lazy {
        try {
            val hasApp = try {
                com.google.firebase.FirebaseApp.getInstance()
                true
            } catch (e: Exception) {
                false
            }
            if (hasApp) {
                FirebaseFirestore.getInstance()
            } else {
                Log.w(TAG, "FirebaseApp is not initialized yet. Firestore is unavailable.")
                null
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firebase Firestore is not initialized or configured: ${e.message}")
            null
        }
    }

    // Bulletproof await helper for Google Tasks to avoid external dependency issues
    private suspend fun <T> com.google.android.gms.tasks.Task<T>.awaitSafe(): T? {
        return suspendCancellableCoroutine { continuation ->
            addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    continuation.resume(task.result)
                } else {
                    continuation.resume(null)
                }
            }
        }
    }

    suspend fun publishCurriculum(curriculum: CanonicalCurriculum): Boolean {
        val firestore = db ?: return false
        return try {
            val data = mapOf(
                "id" to curriculum.id,
                "title" to curriculum.title,
                "description" to curriculum.description,
                "activitiesJson" to Json.encodeToString(curriculum.activities),
                "originalGradeLevel" to curriculum.originalGradeLevel,
                "originalInterests" to curriculum.originalInterests,
                "author" to curriculum.author,
                "timestamp" to curriculum.timestamp,
                "workbookJson" to curriculum.workbookJson
            )
            firestore.collection(COLLECTION_NAME)
                .document(curriculum.id)
                .set(data)
                .awaitSafe()
            Log.d(TAG, "Successfully published curriculum ${curriculum.id} to Firestore")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to publish to Firestore: ${e.message}", e)
            false
        }
    }

    suspend fun fetchCurriculums(): List<CanonicalCurriculum> {
        val firestore = db ?: return emptyList()
        return try {
            val snapshot = firestore.collection(COLLECTION_NAME)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .awaitSafe() ?: return emptyList()
            
            snapshot.documents.mapNotNull { doc ->
                try {
                    val id = doc.getString("id") ?: doc.id
                    val title = doc.getString("title") ?: ""
                    val description = doc.getString("description") ?: ""
                    val activitiesJson = doc.getString("activitiesJson") ?: "[]"
                    val activities = try {
                        Json.decodeFromString<List<CanonicalActivity>>(activitiesJson)
                    } catch (e: Exception) {
                        emptyList()
                    }
                    val originalGradeLevel = doc.getString("originalGradeLevel") ?: "Any"
                    val originalInterests = doc.getString("originalInterests") ?: "General"
                    val author = doc.getString("author") ?: "Anonymous"
                    val timestamp = doc.getLong("timestamp") ?: System.currentTimeMillis()
                    val workbookJson = doc.getString("workbookJson")
                    
                    CanonicalCurriculum(
                        id = id,
                        title = title,
                        description = description,
                        activities = activities,
                        originalGradeLevel = originalGradeLevel,
                        originalInterests = originalInterests,
                        author = author,
                        timestamp = timestamp,
                        workbookJson = workbookJson
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing document ${doc.id}: ${e.message}")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch from Firestore: ${e.message}", e)
            emptyList()
        }
    }
}
