package com.example.data

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

// --- Room Entities ---

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val text: String,
    val isFromUser: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
    val recalledMemoriesJson: String = "" // Serialized list of recalled memories
)

@Entity(tableName = "long_term_memories")
data class LongTermMemoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val content: String,
    val category: String, // e.g., "Student Profile", "Homestead Lore", "Academic Credit", "Philosophy"
    val source: String,   // e.g., "Manual Entry", "Auto-learned"
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "canonical_curriculums")
data class CanonicalCurriculumEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val activitiesJson: String, // Serialized list of activities
    val originalGradeLevel: String,
    val originalInterests: String,
    val author: String,
    val timestamp: Long = System.currentTimeMillis(),
    val workbookJson: String? = null
)

@Entity(tableName = "real_world_activities")
data class RealWorldActivityEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val description: String,
    val durationMinutes: Int,
    val category: String, // e.g., "Gardening", "Baking", "Mechanics", "Carpentry", etc.
    val status: String = "Logged", // "Logged", "Reviewing", "Completed"
    val assignedCredit: String = "", // e.g., "0.5 Credits in Chemistry (Leavening agents)"
    val feedback: String = "", // Adeline's commentary/feedback
    val timestamp: Long = System.currentTimeMillis(),
    val processedTimestamp: Long = 0
)

// --- DAO Interface ---

@Dao
interface DearAdelineDao {
    // Short-term memory (Chat history)
    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC")
    fun getAllMessages(): Flow<List<ChatMessageEntity>>

    @Query("SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT 15")
    suspend fun getRecentMessages(): List<ChatMessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: ChatMessageEntity)

    @Query("DELETE FROM chat_messages")
    suspend fun clearChatHistory()

    // Long-term memory (Knowledge base / Brain)
    @Query("SELECT * FROM long_term_memories ORDER BY timestamp DESC")
    fun getAllLongTermMemories(): Flow<List<LongTermMemoryEntity>>

    @Query("SELECT * FROM long_term_memories ORDER BY timestamp DESC")
    suspend fun getLongTermMemoriesList(): List<LongTermMemoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLongTermMemory(memory: LongTermMemoryEntity)

    @Query("DELETE FROM long_term_memories WHERE id = :id")
    suspend fun deleteLongTermMemory(id: Long)

    // Canonical Curriculum (Cloud Sync / Shared Library)
    @Query("SELECT * FROM canonical_curriculums ORDER BY timestamp DESC")
    fun getAllCanonicalCurriculums(): Flow<List<CanonicalCurriculumEntity>>

    @Query("SELECT * FROM canonical_curriculums ORDER BY timestamp DESC")
    suspend fun getCanonicalCurriculumsList(): List<CanonicalCurriculumEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCanonicalCurriculum(curriculum: CanonicalCurriculumEntity)

    @Query("DELETE FROM canonical_curriculums WHERE id = :id")
    suspend fun deleteCanonicalCurriculum(id: String)

    // Real-world activities logging and evaluation
    @Query("SELECT * FROM real_world_activities ORDER BY timestamp DESC")
    fun getAllRealWorldActivities(): Flow<List<RealWorldActivityEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRealWorldActivity(activity: RealWorldActivityEntity)

    @Query("SELECT * FROM real_world_activities WHERE status = 'Logged' ORDER BY timestamp ASC")
    suspend fun getUnprocessedActivities(): List<RealWorldActivityEntity>

    @Query("DELETE FROM real_world_activities WHERE id = :id")
    suspend fun deleteRealWorldActivity(id: Long)
}

// --- Room Database ---

@Database(entities = [ChatMessageEntity::class, LongTermMemoryEntity::class, CanonicalCurriculumEntity::class, RealWorldActivityEntity::class], version = 4, exportSchema = false)
abstract class DearAdelineDatabase : RoomDatabase() {
    abstract fun dao(): DearAdelineDao

    companion object {
        @Volatile
        private var INSTANCE: DearAdelineDatabase? = null

        fun getDatabase(context: Context): DearAdelineDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    DearAdelineDatabase::class.java,
                    "dear_adeline_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
