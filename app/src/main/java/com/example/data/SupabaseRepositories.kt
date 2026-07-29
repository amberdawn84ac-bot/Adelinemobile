package com.example.data

import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Repositories talking to the shared "dearadeline-withlove" Supabase database
 * (the same backend the web app uses). All access is governed by the Row
 * Level Security policies on each table -- these repositories never bypass
 * that, they just shape the requests.
 */

object AuthRepository {
    suspend fun signUp(email: String, password: String) {
        SupabaseClientProvider.auth.signUpWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun signIn(email: String, password: String) {
        SupabaseClientProvider.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun signOut() {
        SupabaseClientProvider.auth.signOut()
    }

    fun currentUserId(): String? = SupabaseClientProvider.auth.currentUserOrNull()?.id
}

object UserRepository {
    suspend fun getCurrentUserProfile(): UserProfileDto? {
        val userId = AuthRepository.currentUserId() ?: return null
        return SupabaseClientProvider.postgrest.from("User")
            .select {
                filter { eq("id", userId) }
                single()
            }
            .decodeAs<UserProfileDto>()
    }

    suspend fun getChildren(parentId: String): List<UserProfileDto> {
        return SupabaseClientProvider.postgrest.from("User")
            .select {
                filter { eq("parentId", parentId) }
            }
            .decodeList<UserProfileDto>()
    }

    suspend fun upsertProfile(profile: UserProfileDto) {
        SupabaseClientProvider.postgrest.from("User").upsert(profile)
    }
}

object CanonicalLessonRepository {
    suspend fun fetchLessons(track: String? = null, limit: Int = 50, offset: Int = 0): List<CanonicalLessonDto> {
        return SupabaseClientProvider.postgrest.from("CanonicalLesson")
            .select {
                if (track != null) filter { eq("track", track) }
                order("generatedAt", Order.DESCENDING)
                range(offset.toLong(), (offset + limit - 1).toLong())
            }
            .decodeList<CanonicalLessonDto>()
    }
}

object LessonRepository {
    suspend fun fetchLessons(limit: Int = 50, offset: Int = 0): List<LessonDto> {
        return SupabaseClientProvider.postgrest.from("Lesson")
            .select {
                range(offset.toLong(), (offset + limit - 1).toLong())
            }
            .decodeList<LessonDto>()
    }

    suspend fun fetchTracksForLesson(lessonId: String): List<LessonTrackDto> {
        return SupabaseClientProvider.postgrest.from("LessonTrack")
            .select { filter { eq("lessonId", lessonId) } }
            .decodeList<LessonTrackDto>()
    }

    suspend fun fetchBlocksForLesson(lessonId: String): List<LessonBlockDto> {
        return SupabaseClientProvider.postgrest.from("LessonBlock")
            .select {
                filter { eq("lessonId", lessonId) }
                order("order", Order.ASCENDING)
            }
            .decodeList<LessonBlockDto>()
    }
}

object EvidenceRepository {
    suspend fun fetchEvidenceForBlock(blockId: String): List<EvidenceDto> {
        return SupabaseClientProvider.postgrest.from("Evidence")
            .select { filter { eq("blockId", blockId) } }
            .decodeList<EvidenceDto>()
    }
}

object StudentLessonRepository {
    suspend fun fetchProgress(studentId: String, limit: Int = 50, offset: Int = 0): List<StudentLessonDto> {
        return SupabaseClientProvider.postgrest.from("StudentLesson")
            .select {
                filter { eq("studentId", studentId) }
                range(offset.toLong(), (offset + limit - 1).toLong())
            }
            .decodeList<StudentLessonDto>()
    }

    suspend fun startLesson(studentId: String, lessonId: String) {
        SupabaseClientProvider.postgrest.from("StudentLesson")
            .insert(StudentLessonDto(studentId = studentId, lessonId = lessonId))
    }

    @Serializable
    private data class CompletedAtUpdate(val completedAt: String)

    suspend fun completeLesson(studentId: String, lessonId: String, completedAtIso: String) {
        SupabaseClientProvider.postgrest.from("StudentLesson")
            .update(CompletedAtUpdate(completedAt = completedAtIso)) {
                filter {
                    eq("studentId", studentId)
                    eq("lessonId", lessonId)
                }
            }
    }
}

object SubscriptionRepository {
    suspend fun getMySubscription(): SubscriptionDto? {
        val userId = AuthRepository.currentUserId() ?: return null
        return SupabaseClientProvider.postgrest.from("Subscription")
            .select { filter { eq("userId", userId) } }
            .decodeList<SubscriptionDto>()
            .firstOrNull()
    }
}

object StudentJournalRepository {
    suspend fun fetchEntries(studentId: String, limit: Int = 50, offset: Int = 0): List<StudentJournalEntryDto> {
        return SupabaseClientProvider.postgrest.from("student_journal")
            .select {
                filter { eq("student_id", studentId) }
                order("sealed_at", Order.DESCENDING)
                range(offset.toLong(), (offset + limit - 1).toLong())
            }
            .decodeList<StudentJournalEntryDto>()
    }

    suspend fun sealEntry(entry: StudentJournalEntryDto) {
        SupabaseClientProvider.postgrest.from("student_journal").insert(entry)
    }
}

/**
 * Invite codes are never exposed as a readable table (that would let anyone
 * enumerate/guess codes). Redemption goes through the redeem_invite_code
 * Postgres function, which atomically checks and claims the code.
 */
object InviteCodeRepository {
    @Serializable
    private data class RedeemParams(
        @SerialName("p_code") val code: String,
        @SerialName("p_email") val email: String
    )

    suspend fun redeem(code: String, email: String): Boolean {
        return SupabaseClientProvider.postgrest
            .rpc("redeem_invite_code", RedeemParams(code = code, email = email))
            .decodeAs<Boolean>()
    }
}
