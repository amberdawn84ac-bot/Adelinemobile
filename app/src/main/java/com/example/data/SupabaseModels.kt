package com.example.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Data classes mirroring the "dearadeline-withlove" Supabase/Postgres schema.
 * Property names match the Prisma-managed column names (camelCase) as-is;
 * only the legacy snake_case tables need explicit @SerialName mapping.
 */

@Serializable
data class UserProfileDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val isHomestead: Boolean = false,
    val gradeLevel: String? = null,
    val mathLevel: Int? = null,
    val elaLevel: Int? = null,
    val scienceLevel: Int? = null,
    val historyLevel: Int? = null,
    val interests: List<String>? = null,
    val learningStyle: String? = null,
    val pacingMultiplier: Double? = null,
    val state: String? = null,
    val targetGraduationYear: Int? = null,
    val onboardingComplete: Boolean = false,
    val parentId: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class CanonicalLessonDto(
    val id: String,
    val topicSlug: String,
    val topic: String,
    val track: String,
    val title: String,
    val blocksJson: JsonElement,
    val oasStandards: JsonElement? = null,
    val researcherActivated: Boolean = false,
    val agentName: String = "",
    val generatedAt: String? = null,
    val updatedAt: String? = null,
    val pendingApproval: Boolean = false,
    val needsReviewReason: String? = null,
    val lastApprovedAt: String? = null,
    val approvedBy: String? = null
)

@Serializable
data class LessonDto(
    val id: String,
    val title: String,
    val estimatedMinutes: Int,
    val targetGrades: List<String>? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class LessonTrackDto(
    val lessonId: String,
    val track: String
)

@Serializable
data class LessonBlockDto(
    val id: String,
    val lessonId: String,
    val track: String,
    val blockType: String,
    val difficulty: String,
    val order: Int,
    val title: String,
    val content: String,
    val isSilenced: Boolean = false,
    val tags: List<String>? = null,
    val homesteadEnabled: Boolean = false,
    val homesteadContent: String? = null,
    val homesteadPractical: String? = null,
    val createdAt: String? = null
)

@Serializable
data class EvidenceDto(
    val id: String,
    val blockId: String,
    val sourceTitle: String,
    val sourceUrl: String,
    val similarityScore: Double,
    val verdict: String,
    val chunk: String,
    val retrievedAt: String? = null,
    val citationAuthor: String,
    val citationYear: Int,
    val citationArchiveName: String
)

@Serializable
data class StudentLessonDto(
    val studentId: String,
    val lessonId: String,
    val startedAt: String? = null,
    val completedAt: String? = null
)

@Serializable
data class SubscriptionDto(
    val id: String,
    val userId: String,
    val stripeCustomerId: String? = null,
    val stripeSubscriptionId: String? = null,
    val stripePriceId: String? = null,
    val tier: String = "FREE",
    val status: String = "ACTIVE",
    val currentPeriodEnd: String? = null,
    val cancelAtPeriodEnd: Boolean = false,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class StudentJournalEntryDto(
    @SerialName("student_id") val studentId: String,
    @SerialName("lesson_id") val lessonId: String,
    val track: String,
    @SerialName("completed_blocks") val completedBlocks: Int,
    @SerialName("sources_json") val sourcesJson: String? = null,
    @SerialName("sealed_at") val sealedAt: String? = null
)
