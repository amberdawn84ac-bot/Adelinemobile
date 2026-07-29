package com.example.data

import android.content.Context
import android.content.SharedPreferences
import com.example.BuildConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ScriptureEngine(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("scripture_prefs", Context.MODE_PRIVATE)
    
    private val _dailyScripture = MutableStateFlow(prefs.getString("verse_text", "Loading today's scripture...") ?: "")
    val dailyScripture: StateFlow<String> = _dailyScripture

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val systemInstruction = Content(
        parts = listOf(
            Part(
                text = """
                    You are an expert biblical scholar. Provide a short, inspiring daily scripture reading.
                    
                    CRITICAL INSTRUCTIONS & TRANSLATION RULES:
                    1. Use the original scripture text, translated carefully so that it retains its deep theological meaning and original literary context.
                    2. Maintain original Hebrew and Aramaic names and titles in their authentic transliterated forms (e.g., use "Yeshua" instead of "Jesus", "Yahweh" or "YHVH" instead of "the LORD", "Elohim", "El Shaddai", "Miriam" instead of "Mary", "Yochanan" instead of "John", "Moshe" instead of "Moses").
                    3. Do NOT include any commentary, reflections, notes, or extra explanations.
                    4. Output ONLY the verse text followed by its citation (e.g., "Yochanan 3:16" or "Tehillim 23:1") on the last line.
                    5. Output the text in clean, plain text with no markdown formatting (no bolding, no italics, no asterisks, no quotes).
                    6. Select a unique, uplifting verse suitable for daily bread inspiration, ensuring a high variety of scriptures from both Hebrew scriptures (Tanakh) and Apostolic scriptures (Brit Hadashah).
                """.trimIndent()
            )
        )
    )

    suspend fun fetchDailyScripture(forceRefresh: Boolean = false) {
        val todayDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val savedDate = prefs.getString("verse_date", "")
        
        if (!forceRefresh && todayDate == savedDate && prefs.contains("verse_text")) {
            _dailyScripture.value = prefs.getString("verse_text", "") ?: ""
            return
        }

        _isLoading.value = true
        val request = GenerateContentRequest(
            contents = listOf(Content(role = "user", parts = listOf(Part(text = "Provide today's daily bread scripture.")))),
            systemInstruction = systemInstruction,
            generationConfig = GenerationConfig(temperature = 0.9f)
        )
        
        try {
            val response = RetrofitClient.service.generateContent(BuildConfig.GEMINI_API_KEY, request)
            var text = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: ""
            text = text.trim()
            
            if (text.isNotBlank()) {
                _dailyScripture.value = text
                prefs.edit()
                    .putString("verse_date", todayDate)
                    .putString("verse_text", text)
                    .apply()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            // If it fails, keep the old one or show an error
            if (_dailyScripture.value.isEmpty() || _dailyScripture.value == "Loading today's scripture...") {
                _dailyScripture.value = "Failed to load scripture."
            }
        } finally {
            _isLoading.value = false
        }
    }
}
