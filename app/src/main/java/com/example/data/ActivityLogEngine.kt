package com.example.data

import com.example.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class ActivityEvaluationDto(
    val assignedCredit: String,
    val feedback: String
)

class ActivityLogEngine(private val dao: DearAdelineDao) {
    
    val allActivities: Flow<List<RealWorldActivityEntity>> = dao.getAllRealWorldActivities()
    
    private val _isReviewing = MutableStateFlow(false)
    val isReviewing: StateFlow<Boolean> = _isReviewing

    private val json = Json { ignoreUnknownKeys = true }

    // Log a new activity locally and trigger the review background coroutine
    suspend fun logActivity(title: String, description: String, durationMinutes: Int, category: String) {
        withContext(Dispatchers.IO) {
            val newActivity = RealWorldActivityEntity(
                title = title,
                description = description,
                durationMinutes = durationMinutes,
                category = category,
                status = "Logged"
            )
            dao.insertRealWorldActivity(newActivity)
            
            // Automatically trigger review in the background
            CoroutineScope(Dispatchers.IO).launch {
                reviewUnprocessedActivities()
            }
        }
    }

    // Deletes an activity from the log
    suspend fun deleteActivity(id: Long) {
        withContext(Dispatchers.IO) {
            dao.deleteRealWorldActivity(id)
        }
    }

    // Automatically review any activities with status = "Logged"
    suspend fun reviewUnprocessedActivities() {
        if (_isReviewing.value) return
        _isReviewing.value = true
        withContext(Dispatchers.IO) {
            try {
                val unprocessed = dao.getUnprocessedActivities()
                for (activity in unprocessed) {
                    // Update status to Reviewing
                    val reviewingActivity = activity.copy(status = "Reviewing")
                    dao.insertRealWorldActivity(reviewingActivity)

                    val evaluation = evaluateActivityWithGemini(reviewingActivity)
                    if (evaluation != null) {
                        val completedActivity = reviewingActivity.copy(
                            status = "Completed",
                            assignedCredit = evaluation.assignedCredit,
                            feedback = evaluation.feedback,
                            processedTimestamp = System.currentTimeMillis()
                        )
                        dao.insertRealWorldActivity(completedActivity)
                    } else {
                        // Revert back to Logged or mark as Failed/Error so it doesn't get stuck
                        val failedActivity = reviewingActivity.copy(
                            status = "Logged",
                            feedback = "Review timed out or could not be processed. Please check your network and try again."
                        )
                        dao.insertRealWorldActivity(failedActivity)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isReviewing.value = false
            }
        }
    }

    private suspend fun evaluateActivityWithGemini(activity: RealWorldActivityEntity): ActivityEvaluationDto? {
        val prompt = """
            A homeschooling student has logged a real-world activity. 
            Evaluate the activity and map it to relevant, real-world academic fields.
            
            [ACTIVITY DETAILS]:
            Title: "${activity.title}"
            Category: "${activity.category}"
            Duration: ${activity.durationMinutes} minutes
            Description/What they did: "${activity.description}"
            
            [INSTRUCTIONS]:
            1. Act as Adeline, a wise, intellectual, and supportive homeschooling mentor. Do NOT use overly sugary terms of endearment like "dear" or "sweetheart".
            2. Determine appropriate academic credits to award. Academic credits are typically small fractions (e.g., 0.1 to 0.5 credits) based on the effort, learning depth, and time. Assign credit to subjects like Chemistry, Applied Mathematics, Botany, Soil Biology, Mechanical Physics, Carpentry, Home Economics, etc.
            3. Provide detailed, beautiful, and articulate mentorship feedback explaining exactly how this real-world task connects to deeper academic concepts, prompting them to keep learning.
            4. You MUST output your response in the following strict JSON format, with no markdown tags or wrapper text:
            {
              "assignedCredit": "Type and amount of credit assigned (e.g. '0.2 Credits in Applied Organic Chemistry')",
              "feedback": "Your sophisticated and encouraging academic assessment."
            }
        """.trimIndent()

        val systemInstruction = Content(
            parts = listOf(
                Part(
                    text = "You are Adeline, an educational concierge and wise mentor. You review real-world actions (baking, gardening, fixing objects) and assign specific, realistic fractional academic credits. You always respond with a clean JSON object containing 'assignedCredit' and 'feedback' fields."
                )
            )
        )

        val request = GenerateContentRequest(
            contents = listOf(Content(role = "user", parts = listOf(Part(text = prompt)))),
            systemInstruction = systemInstruction,
            generationConfig = GenerationConfig(
                temperature = 0.7f
            )
        )

        return try {
            val response = RetrofitClient.service.generateContent(BuildConfig.GEMINI_API_KEY, request)
            var jsonText = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: ""
            jsonText = jsonText.replace("```json", "").replace("```", "").trim()
            
            json.decodeFromString<ActivityEvaluationDto>(jsonText)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
