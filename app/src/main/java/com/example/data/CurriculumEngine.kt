package com.example.data

import com.example.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

data class LessonPlan(
    val id: String,
    val title: String,
    val description: String,
    val activities: List<Activity>
)

data class Activity(
    val title: String,
    val creditType: String,
    val description: String
)

@Serializable
data class LessonPlanDto(
    val title: String,
    val description: String,
    val activities: List<ActivityDto>
)

@Serializable
data class ActivityDto(
    val title: String,
    val creditType: String,
    val description: String
)

class CurriculumEngine(private val dao: DearAdelineDao) {
    private val _lessonPlans = MutableStateFlow<List<LessonPlan>>(emptyList())
    val lessonPlans: StateFlow<List<LessonPlan>> = _lessonPlans
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _isCloudSyncing = MutableStateFlow(false)
    val isCloudSyncing: StateFlow<Boolean> = _isCloudSyncing

    // Expose the canonical curriculum library reactively from database
    val canonicalCurriculums: Flow<List<CanonicalCurriculum>> = dao.getAllCanonicalCurriculums()
        .map { entities ->
            entities.map { entity ->
                val activities = try {
                    Json.decodeFromString<List<CanonicalActivity>>(entity.activitiesJson)
                } catch (e: Exception) {
                    emptyList()
                }
                CanonicalCurriculum(
                    id = entity.id,
                    title = entity.title,
                    description = entity.description,
                    activities = activities,
                    originalGradeLevel = entity.originalGradeLevel,
                    originalInterests = entity.originalInterests,
                    author = entity.author,
                    timestamp = entity.timestamp,
                    workbookJson = entity.workbookJson
                )
            }
        }.flowOn(Dispatchers.IO)
    
    private val systemInstruction = Content(
        parts = listOf(
            Part(
                text = """
                    You are Adeline's Curriculum Engine. Your job is to generate personalized, gamified lesson plans based on a student's interests and performance.
                    Translate everyday activities into academic credit (e.g., baking = chemistry, gardening = biology, fixing bikes = mechanical engineering).
                    Ensure all information aligns with a biblical worldview, original historical texts, and focuses on practical skills for functional adults.
                    Output MUST be in the following strict JSON format without Markdown formatting:
                    {
                        "title": "Lesson Plan Title",
                        "description": "Brief description of the overall module.",
                        "activities": [
                            {
                                "title": "Activity Name",
                                "creditType": "Academic Subject",
                                "description": "How to do it and what they learn."
                            }
                        ]
                    }
                """.trimIndent()
            )
        )
    )

    private val json = Json { ignoreUnknownKeys = true }

    init {
        // Prepopulate standard library
        CoroutineScope(Dispatchers.IO).launch {
            prepopulateDefaultLibrary()
            syncWithCloud()
        }
    }

    private suspend fun prepopulateDefaultLibrary() {
        val existing = dao.getCanonicalCurriculumsList()
        if (existing.isEmpty()) {
            val defaults = listOf(
                CanonicalCurriculum(
                    id = "baking-bread-chemistry",
                    title = "Baking Bread: The Science of Sourdough",
                    description = "An interactive lesson where baking bread is explored as chemistry and biology.",
                    originalGradeLevel = "5th Grade",
                    originalInterests = "Baking, Food",
                    author = "System Library",
                    activities = listOf(
                        CanonicalActivity("The Great Yeast Expansion", "Biology", "Leo observes how live yeast cultures metabolize sugar, generating carbon dioxide to make the dough rise."),
                        CanonicalActivity("Gluten Matrix Synthesis", "Chemistry", "Measuring how water content and kneading speed alter protein bonding to form elastic gluten webs."),
                        CanonicalActivity("Oven Spring Heat Transfer", "Physics", "Experimenting with steam injection and heat radiation to achieve perfect crust expansion.")
                    )
                ),
                CanonicalCurriculum(
                    id = "gardening-soil-biology",
                    title = "Homestead Soil Ecosystems",
                    description = "Exploring worm composting, pH soil testing, and root structure biology.",
                    originalGradeLevel = "4th Grade",
                    originalInterests = "Gardening, Outdoors",
                    author = "System Library",
                    activities = listOf(
                        CanonicalActivity("Worm Farm Decomposition", "Biology", "Building a vermicomposting bin and tracking how red wigglers break down raw vegetable scraps."),
                        CanonicalActivity("N-P-K Soil Chemical Assays", "Chemistry", "Performing simple chemical tests to measure nitrogen, phosphorus, and pH balance of different soil sections."),
                        CanonicalActivity("Mycorrhizal Symbiosis", "Mycology", "Studying under a magnifying glass how fungal networks connect root nodes to exchange vital minerals.")
                    )
                )
            )
            for (curr in defaults) {
                dao.insertCanonicalCurriculum(
                    CanonicalCurriculumEntity(
                        id = curr.id,
                        title = curr.title,
                        description = curr.description,
                        activitiesJson = Json.encodeToString(curr.activities),
                        originalGradeLevel = curr.originalGradeLevel,
                        originalInterests = curr.originalInterests,
                        author = curr.author,
                        timestamp = curr.timestamp
                    )
                )
            }
        }
    }

    // Pull from Firestore cloud and save to local Room cache (Offline synchronization)
    suspend fun syncWithCloud() {
        _isCloudSyncing.value = true
        withContext(Dispatchers.IO) {
            try {
                val cloudCurriculums = FirestoreCurriculumService.fetchCurriculums()
                for (curr in cloudCurriculums) {
                    dao.insertCanonicalCurriculum(
                        CanonicalCurriculumEntity(
                            id = curr.id,
                            title = curr.title,
                            description = curr.description,
                            activitiesJson = Json.encodeToString(curr.activities),
                            originalGradeLevel = curr.originalGradeLevel,
                            originalInterests = curr.originalInterests,
                            author = curr.author,
                            timestamp = curr.timestamp,
                            workbookJson = curr.workbookJson
                        )
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isCloudSyncing.value = false
            }
        }
    }

    // Save a lesson to the Library (Local cache database + published to Cloud Firestore)
    suspend fun publishToLibrary(
        title: String,
        description: String,
        activities: List<Activity>,
        gradeLevel: String,
        interests: String,
        author: String = "Adeline's App",
        workbookJson: String? = null
    ): Boolean {
        return withContext(Dispatchers.IO) {
            val id = java.util.UUID.randomUUID().toString()
            val canonicalActivities = activities.map { CanonicalActivity(it.title, it.creditType, it.description) }
            val curriculum = CanonicalCurriculum(
                id = id,
                title = title,
                description = description,
                activities = canonicalActivities,
                originalGradeLevel = gradeLevel,
                originalInterests = interests,
                author = author,
                workbookJson = workbookJson
            )
            
            // 1. Store in local Room cache first (Immediate UI feedback + offline availability)
            dao.insertCanonicalCurriculum(
                CanonicalCurriculumEntity(
                    id = id,
                    title = title,
                    description = description,
                    activitiesJson = Json.encodeToString(canonicalActivities),
                    originalGradeLevel = gradeLevel,
                    originalInterests = interests,
                    author = author,
                    timestamp = curriculum.timestamp,
                    workbookJson = workbookJson
                )
            )

            // 2. Publish to cloud Firestore
            val cloudSuccess = FirestoreCurriculumService.publishCurriculum(curriculum)
            cloudSuccess
        }
    }

    // Core RAG/Adaptation Engine: Takes a canonical lesson plan and tweaks/adapts it to another student's parameters using Gemini!
    suspend fun adaptCurriculum(
        original: CanonicalCurriculum,
        targetGradeLevel: String,
        targetInterests: String
    ): LessonPlan? {
        _isLoading.value = true
        
        val prompt = """
            We are practicing curriculum adaptation.
            Take the following Canonical Lesson Plan and tweak it to be highly engaging and educational for a student at the [${targetGradeLevel}] level who is deeply interested in [${targetInterests}].
            
            [CANONICAL LESSON]:
            Title: ${original.title}
            Description: ${original.description}
            
            Activities:
            ${original.activities.joinToString("\n") { "- ${it.title} (${it.creditType}): ${it.description}" }}
            
            [ADAPTATION RULES]:
            1. Tweak the Title and Description to highlight the connection to the new interest: "${targetInterests}".
            2. Match the complexity, depth, and vocabulary strictly to a ${targetGradeLevel} level.
            3. Recast the original activities/academic subjects to relate directly to "${targetInterests}" while preserving the core lessons (e.g. if original is biology of baking yeast, adapt to biology of food in space if interests include outer space).
            4. Keep the output in the identical JSON format. No markdown, no leading backticks.
        """.trimIndent()

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
            
            val jsonObj = json.decodeFromString<LessonPlanDto>(jsonText)
            
            val adaptedPlan = LessonPlan(
                id = java.util.UUID.randomUUID().toString(),
                title = jsonObj.title,
                description = jsonObj.description,
                activities = jsonObj.activities.map { Activity(it.title, it.creditType, it.description) }
            )
            
            // Add to active view list
            _lessonPlans.update { listOf(adaptedPlan) + it }
            adaptedPlan
            
        } catch (e: Exception) {
            e.printStackTrace()
            null
        } finally {
            _isLoading.value = false
        }
    }

    // Standard local generation
    suspend fun generateLessonPlan(interest: String) {
        _isLoading.value = true
        val prompt = "Create a lesson plan for a student interested in: $interest"
        val request = GenerateContentRequest(
            contents = listOf(Content(role = "user", parts = listOf(Part(text = prompt)))),
            systemInstruction = systemInstruction,
            generationConfig = GenerationConfig(
                temperature = 0.7f
            )
        )
        
        try {
            val response = RetrofitClient.service.generateContent(BuildConfig.GEMINI_API_KEY, request)
            var jsonText = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: ""
            jsonText = jsonText.replace("```json", "").replace("```", "").trim()
            
            val jsonObj = json.decodeFromString<LessonPlanDto>(jsonText)
            
            val newPlan = LessonPlan(
                id = java.util.UUID.randomUUID().toString(),
                title = jsonObj.title,
                description = jsonObj.description,
                activities = jsonObj.activities.map { Activity(it.title, it.creditType, it.description) }
            )
            
            _lessonPlans.update { listOf(newPlan) + it }
            
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            _isLoading.value = false
        }
    }

    suspend fun generateWorkbookForPlan(
        title: String,
        description: String,
        activitiesList: List<CanonicalActivity>,
        gradeLevel: String
    ): LessonWorkbook? {
        val activitiesText = activitiesList.joinToString("\n") { "- ${it.title} (${it.creditType}): ${it.description}" }
        val prompt = """
            Create a highly engaging, printable educational Mini-Workbook and Textbook lesson based on the following module:
            
            Title: "$title"
            Description: "$description"
            Activities:
            $activitiesText
            
            Grade Level target: $gradeLevel
            
            Generate the lesson content strictly adhering to these rules:
            1. storyTitle and storyContent: Write a whimsical, highly conversational, and engaging educational narrative in the style of "Life of Fred" (where complex math/science/history ideas are embedded in funny, relatable character-driven adventures, making them exciting and fun). Let the narrative contain rich pedagogical insights.
            2. feynmanExplanation: Act as an expert who can break down the most complicated concepts of this lesson in extremely simple terms, using a perfect analogy, explaining it so simply that a 10-year-old can intuitively grasp the core principles, before mapping to actual professional vocabulary.
            3. readAloudLecture: Provide the full spoken textbook text that a parent can read aloud or a student can read themselves for a complete, structured academic lesson.
            4. experiments: Formulate 1 to 2 detailed, practical, hands-on experiments or kitchen-science projects. Specify clear, household items for materials, step-by-step instructions, and the underlying educational insight.
            5. journalPrompts: Write 3 meaningful, thought-provoking questions or observation prompts for the student to fill in after completing the lesson.
            6. standardsAligned: List 2 to 3 formal educational standard alignments (e.g., Next Generation Science Standards (NGSS), Common Core, practical homestead skills, etc.).
            7. portfolioSummary: Provide a highly professional, beautiful, and complete summary certifying what was achieved, the standard-alignment mappings, and concluding feedback.
            
            Output MUST be in the following strict JSON format, with no markdown codeblock tags or extra text:
            {
              "title": "Workbook Title",
              "gradeLevel": "$gradeLevel",
              "subjectArea": "Primary Academic Subject Area",
              "storyTitle": "Story Title",
              "storyContent": "Whimsical Life of Fred style narrative...",
              "feynmanExplanation": "The Feynman Method explanation...",
              "readAloudLecture": "The complete lecture text...",
              "experiments": [
                {
                  "title": "Experiment Title",
                  "materials": ["Material 1", "Material 2"],
                  "steps": ["Step 1", "Step 2"],
                  "educationalInsight": "What this experiment proves"
                }
              ],
              "journalPrompts": ["Prompt 1", "Prompt 2", "Prompt 3"],
              "standardsAligned": ["Standard 1", "Standard 2"],
              "portfolioSummary": "Official portfolio documentation summary..."
            }
        """.trimIndent()

        val request = GenerateContentRequest(
            contents = listOf(Content(role = "user", parts = listOf(Part(text = prompt)))),
            systemInstruction = Content(
                parts = listOf(Part(text = "You are Adeline's Textbook Generator. You output clean, valid JSON matching the schema for LessonWorkbook exactly, with NO markdown backticks."))
            ),
            generationConfig = GenerationConfig(
                temperature = 0.7f
            )
        )

        return withContext(Dispatchers.IO) {
            try {
                val response = RetrofitClient.service.generateContent(BuildConfig.GEMINI_API_KEY, request)
                var jsonText = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: ""
                jsonText = jsonText.replace("```json", "").replace("```", "").trim()
                json.decodeFromString<LessonWorkbook>(jsonText)
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }

    suspend fun updateCanonicalWorkbook(id: String, workbookJson: String) {
        withContext(Dispatchers.IO) {
            val curriculums = dao.getCanonicalCurriculumsList()
            val match = curriculums.find { it.id == id }
            if (match != null) {
                val updated = match.copy(workbookJson = workbookJson)
                dao.insertCanonicalCurriculum(updated)
                // Publish to cloud Firestore
                val activities = try {
                    Json.decodeFromString<List<CanonicalActivity>>(updated.activitiesJson)
                } catch (e: Exception) {
                    emptyList()
                }
                FirestoreCurriculumService.publishCurriculum(
                    CanonicalCurriculum(
                        id = updated.id,
                        title = updated.title,
                        description = updated.description,
                        activities = activities,
                        originalGradeLevel = updated.originalGradeLevel,
                        originalInterests = updated.originalInterests,
                        author = updated.author,
                        timestamp = updated.timestamp,
                        workbookJson = workbookJson
                    )
                )
            }
        }
    }

    suspend fun completeWorkbookAndLog(workbook: LessonWorkbook, journalAnswers: List<String>) {
        withContext(Dispatchers.IO) {
            val feedbackText = "Student's Journal Responses:\n" +
                    workbook.journalPrompts.zip(journalAnswers) { prompt, ans ->
                        "• $prompt\n  Answer: $ans"
                    }.joinToString("\n\n")
            
            val logEntity = RealWorldActivityEntity(
                title = "Workbook Mastery: " + workbook.title,
                description = "Mastered workbook lesson covering ${workbook.subjectArea}. Read 'Life of Fred' style narrative, analyzed via Feynman Method, and completed practical kitchen/lab experiments.",
                durationMinutes = 120,
                category = "Academic Workbook",
                status = "Completed",
                assignedCredit = "1.0 Credit in " + workbook.subjectArea + " (${workbook.gradeLevel})",
                feedback = "$feedbackText\n\nAdeline's Evaluative Summary:\nStudent has successfully completed all curricular elements of this module. This work fully aligns with: " + workbook.standardsAligned.joinToString(", ") + ". Ready for printable portfolio inclusion.",
                timestamp = System.currentTimeMillis()
            )
            dao.insertRealWorldActivity(logEntity)
        }
    }
}
