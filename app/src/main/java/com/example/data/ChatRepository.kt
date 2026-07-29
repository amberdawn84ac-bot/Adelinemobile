package com.example.data

import com.example.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class ChatMessage(
    val id: String,
    val text: String,
    val isFromUser: Boolean,
    val isLoading: Boolean = false,
    val recalledMemories: List<String> = emptyList()
)

class ChatRepository(private val dao: DearAdelineDao) {

    private val _loadingMessage = MutableStateFlow<ChatMessage?>(null)

    // Expose short-term messages reactively from Room database merged with temporary loading message
    val messages: Flow<List<ChatMessage>> = combine(
        dao.getAllMessages(),
        _loadingMessage
    ) { dbMsgs, loadingMsg ->
        val mapped = dbMsgs.map { entity ->
            ChatMessage(
                id = entity.id.toString(),
                text = entity.text,
                isFromUser = entity.isFromUser,
                recalledMemories = parseRecalledMemories(entity.recalledMemoriesJson)
            )
        }
        if (loadingMsg != null) {
            mapped + loadingMsg
        } else {
            mapped
        }
    }

    // Expose long-term memories reactively
    val allLongTermMemories: Flow<List<LongTermMemoryEntity>> = dao.getAllLongTermMemories()

    private val systemInstruction = Content(
        parts = listOf(
            Part(
                text = "You are Adeline, an educational concierge for a homeschooling app named Dear Adeline. " +
                       "You are modeled as a wise, encouraging academic mentor who treats education as a serious but exciting lifelong pursuit. " +
                       "Speak clearly, articulately, and directly. Avoid overly saccharine grandma-like terms of endearment like \"dear\", \"sweetheart\", or \"grandchild\". " +
                       "Instead, sound supportive, highly knowledgeable, and deeply encouraging, fostering critical thinking and intellectual growth. " +
                       "You teach truth and ensure information is verified through credible academic sources. " +
                       "You do not teach from textbooks, but from original texts with an Everett Fox type style. " +
                       "You use a Feynman style for teaching, beginning simply. You teach what a student will need to know to be a functional adult. " +
                       "You teach real history as it actually happened, real science as can be tested and hypothesized. " +
                       "You teach kids that love is above all else. You encourage them about injustices and call to action against corruption. " +
                       "You also act as a Curriculum Engine: you suggest curated learning modules based on expressed interests. " +
                       "You dynamically integrate real-world activities (like baking, gardening, or fixing bikes) into lesson plans, assigning academic credit (e.g., baking becomes chemistry, gardening is biology). " +
                       "Keep responses conversational but intellectual, inspiring, and tailored for an inquisitive student."
            )
        )
    )

    init {
        CoroutineScope(Dispatchers.IO).launch {
            prepopulateDefaultMemories()
        }
    }

    private suspend fun prepopulateDefaultMemories() {
        val existing = dao.getLongTermMemoriesList()
        if (existing.isEmpty()) {
            val defaults = listOf(
                LongTermMemoryEntity(
                    content = "The student's name is Leo. He is 10 years old, highly creative, and loves hands-on projects.",
                    category = "Student Profile",
                    source = "System Initializer"
                ),
                LongTermMemoryEntity(
                    content = "Grandpa built the big red barn on our farm in 1948. It has been the heart of our homestead ever since.",
                    category = "Homestead Lore",
                    source = "System Initializer"
                ),
                LongTermMemoryEntity(
                    content = "Adeline's secret recipe for oatmeal cookies requires exactly 1 teaspoon of nutmeg, brown butter, and a pinch of cinnamon.",
                    category = "Homestead Lore",
                    source = "System Initializer"
                ),
                LongTermMemoryEntity(
                    content = "Our farm is located in the beautiful rolling hills of the Midwest, where we experience warm, sunny summers and snowy, peaceful winters.",
                    category = "Homestead Lore",
                    source = "System Initializer"
                ),
                LongTermMemoryEntity(
                    content = "Leo is currently working on a 'Gardening Biology' module, earning academic credits for planting tomatoes and learning about soil health.",
                    category = "Academic Credit",
                    source = "System Initializer"
                ),
                LongTermMemoryEntity(
                    content = "Adeline's teaching core: 'Love is above all else.' Injustices should be met with kindness, courage, and persistent, peaceful action.",
                    category = "Philosophy",
                    source = "System Initializer"
                )
            )
            for (memory in defaults) {
                dao.insertLongTermMemory(memory)
            }
        }
    }

    // Manual additions/deletions of long-term memory
    suspend fun addLongTermMemory(content: String, category: String, source: String = "Manual Entry") {
        withContext(Dispatchers.IO) {
            dao.insertLongTermMemory(
                LongTermMemoryEntity(
                    content = content,
                    category = category,
                    source = source
                )
            )
        }
    }

    suspend fun deleteLongTermMemory(id: Long) {
        withContext(Dispatchers.IO) {
            dao.deleteLongTermMemory(id)
        }
    }

    suspend fun clearChatHistory() {
        withContext(Dispatchers.IO) {
            dao.clearChatHistory()
        }
    }

    // --- Local RAG Retrieval Core ---
    suspend fun retrieveRelevantMemories(query: String): List<Pair<LongTermMemoryEntity, Double>> {
        val memories = dao.getLongTermMemoriesList()
        val stopWords = setOf(
            "a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "where", "how", 
            "why", "who", "what", "is", "are", "was", "were", "be", "been", "being", "to", "of", 
            "in", "on", "at", "by", "for", "with", "about", "again", "you", "your", "my", "me", 
            "i", "he", "she", "it", "they", "we", "this", "that", "these", "those"
        )
        val queryTokens = query.lowercase()
            .replace(Regex("[^a-zA-Z0-9\\s]"), "")
            .split("\\s+".toRegex())
            .filter { it.isNotBlank() && !stopWords.contains(it) }
            .toSet()

        if (queryTokens.isEmpty()) return emptyList()

        val scored = memories.map { memory ->
            val contentTokens = memory.content.lowercase()
                .replace(Regex("[^a-zA-Z0-9\\s]"), "")
                .split("\\s+".toRegex())
                .filter { it.isNotBlank() }
                .toSet()

            // Calculate intersection-based overlap score
            val intersection = queryTokens.intersect(contentTokens)
            val score = intersection.size.toDouble() / queryTokens.size.toDouble()
            Pair(memory, score)
        }

        return scored.filter { it.second > 0.0 }
            .sortedByDescending { it.second }
            .take(3)
    }

    // Process a user message using RAG and persisting in SQLite
    suspend fun sendMessage(text: String) {
        // 1. Save user message to database
        val userEntity = ChatMessageEntity(text = text, isFromUser = true)
        withContext(Dispatchers.IO) {
            dao.insertMessage(userEntity)
        }

        // 2. Local Retrieval (RAG Brain)
        val retrieved = retrieveRelevantMemories(text)
        val recalledTexts = retrieved.map { it.first.content }
        val recalledJson = recalledTexts.joinToString("|||")

        // 3. Setup temporary loading message for Compose UI
        val aiLoadingId = java.util.UUID.randomUUID().toString()
        _loadingMessage.value = ChatMessage(id = aiLoadingId, text = "", isFromUser = false, isLoading = true, recalledMemories = recalledTexts)

        try {
            // 4. Retrieve recent message history from short-term memory (database)
            val recentEntities = withContext(Dispatchers.IO) {
                dao.getRecentMessages()
            }
            // Sort to chronological order (oldest first)
            val chronological = recentEntities.sortedBy { it.timestamp }

            // 5. Build contents array for Gemini API call
            val contentsList = mutableListOf<Content>()
            
            // Map past conversations
            chronological.forEach { msg ->
                val roleName = if (msg.isFromUser) "user" else "model"
                contentsList.add(Content(role = roleName, parts = listOf(Part(text = msg.text))))
            }

            // Assemble system instructions augmented with retrieved long-term memories (RAG)
            val baseInstructions = systemInstruction.parts.firstOrNull()?.text ?: ""
            val contextAugmentation = if (retrieved.isNotEmpty()) {
                "\n\n[RECALLED LONG-TERM MEMORIES (Incorporate these factual details directly if relevant to the user's input)]:\n" +
                retrieved.joinToString("\n") { "- ${it.first.content}" }
            } else {
                ""
            }

            val augmentedSystemInstruction = Content(
                parts = listOf(Part(text = baseInstructions + contextAugmentation))
            )

            // 6. Call Gemini
            val request = GenerateContentRequest(
                contents = contentsList,
                systemInstruction = augmentedSystemInstruction
            )
            
            val response = withContext(Dispatchers.IO) {
                RetrofitClient.service.generateContent(BuildConfig.GEMINI_API_KEY, request)
            }
            
            val responseText = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                ?: "I'm having some trouble processing that right now. Could you rephrase your question?"

            // 7. Save model response to short-term memory database
            val responseEntity = ChatMessageEntity(
                text = responseText,
                isFromUser = false,
                recalledMemoriesJson = recalledJson
            )
            withContext(Dispatchers.IO) {
                dao.insertMessage(responseEntity)
            }

        } catch (e: Exception) {
            val errorMsg = "An error occurred while connecting: ${e.message}. Please verify the internet connection and API configuration."
            val errorEntity = ChatMessageEntity(
                text = errorMsg,
                isFromUser = false
            )
            withContext(Dispatchers.IO) {
                dao.insertMessage(errorEntity)
            }
        } finally {
            // Clear loading state
            _loadingMessage.value = null
        }
    }

    // Helper utilities for delimited recalled memories storage
    private fun parseRecalledMemories(json: String): List<String> {
        return if (json.isBlank()) emptyList() else json.split("|||")
    }
}
