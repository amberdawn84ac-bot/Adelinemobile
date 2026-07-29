package com.example.data

import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/**
 * Backs Adeline's Hollow with the shared Supabase database.
 *
 * The two read paths go through Postgres functions rather than table queries
 * on purpose: resolving "the next quest this student hasn't started" on the
 * client would mean downloading their entire completed-lesson history to
 * filter against, which stops working long before we reach thousands of
 * students. Both functions run SECURITY INVOKER, so row level security still
 * scopes every read to the signed-in student.
 */

@Serializable
data class QuestDto(
    @SerialName("lesson_id") val lessonId: String,
    val title: String,
    val topic: String,
    @SerialName("topic_slug") val topicSlug: String,
    val track: String,
    @SerialName("block_count") val blockCount: Int = 0
)

@Serializable
data class ProgressSummaryDto(
    @SerialName("completed_count") val completedCount: Int = 0,
    @SerialName("started_count") val startedCount: Int = 0,
    @SerialName("tracks_completed") val tracksCompleted: List<String> = emptyList()
)

object GameProgressRepository {

    /**
     * The student's next unstarted lesson on [track], or null when they have
     * cleared everything currently published for it.
     */
    suspend fun nextQuest(track: String): QuestDto? =
        SupabaseClientProvider.postgrest
            .rpc("next_quest_for_track", buildJsonObject { put("p_track", track) })
            .decodeList<QuestDto>()
            .firstOrNull()

    /** Whole-HUD progress in a single round trip. */
    suspend fun progressSummary(): ProgressSummaryDto =
        SupabaseClientProvider.postgrest
            .rpc("student_progress_summary")
            .decodeList<ProgressSummaryDto>()
            .firstOrNull() ?: ProgressSummaryDto()

    /**
     * Record that the student took on a quest. The primary key is
     * (studentId, lessonId), so re-accepting the same quest is a no-op rather
     * than a duplicate row.
     */
    suspend fun acceptQuest(studentId: String, lessonId: String) {
        SupabaseClientProvider.postgrest.from("StudentLesson")
            .upsert(StudentLessonDto(studentId = studentId, lessonId = lessonId))
    }
}
