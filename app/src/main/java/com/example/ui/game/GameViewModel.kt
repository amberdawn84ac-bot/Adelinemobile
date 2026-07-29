package com.example.ui.game

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AuthRepository
import com.example.data.GameProgressRepository
import com.example.data.QuestDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** A student's headline numbers, derived from how many quests they've finished. */
data class PlayerStats(
    val level: Int = 1,
    val xpIntoLevel: Int = 0,
    val xpForNextLevel: Int = PlayerProgression.xpForLevel(1),
    val coins: Int = 0
) {
    val levelProgress: Float
        get() = if (xpForNextLevel <= 0) 0f else (xpIntoLevel.toFloat() / xpForNextLevel).coerceIn(0f, 1f)
}

/**
 * Pure progression maths, kept free of Android and network types so it can be
 * unit tested and so the web app can mirror the same curve.
 */
object PlayerProgression {
    const val XP_PER_QUEST = 25
    const val COINS_PER_QUEST = 10

    /** XP needed to clear [level]; each level costs a little more than the last. */
    fun xpForLevel(level: Int): Int = 200 + (level - 1) * 40

    fun statsFor(completedQuests: Int): PlayerStats {
        var remaining = completedQuests.coerceAtLeast(0) * XP_PER_QUEST
        var level = 1
        while (remaining >= xpForLevel(level)) {
            remaining -= xpForLevel(level)
            level++
        }
        return PlayerStats(
            level = level,
            xpIntoLevel = remaining,
            xpForNextLevel = xpForLevel(level),
            coins = completedQuests.coerceAtLeast(0) * COINS_PER_QUEST
        )
    }
}

/** What a single room's quest card should be showing. */
sealed interface QuestUiState {
    data object Loading : QuestUiState
    data class Available(val quest: QuestDto, val accepted: Boolean = false) : QuestUiState
    data object AllCaughtUp : QuestUiState
    data class Failed(val message: String) : QuestUiState
}

/**
 * Holds all of Adeline's Hollow's state. Living in a ViewModel means rotating
 * the tablet or collapsing the app doesn't refetch quests or lose an accept
 * that's still in flight.
 */
class GameViewModel : ViewModel() {

    private val _stats = MutableStateFlow(PlayerStats())
    val stats: StateFlow<PlayerStats> = _stats.asStateFlow()

    /** Rooms whose track the student has finished at least one lesson in. */
    private val _badges = MutableStateFlow<Set<GameRoom>>(emptySet())
    val badges: StateFlow<Set<GameRoom>> = _badges.asStateFlow()

    private val _quests = MutableStateFlow<Map<GameRoom, QuestUiState>>(emptyMap())
    val quests: StateFlow<Map<GameRoom, QuestUiState>> = _quests.asStateFlow()

    /** True when nobody is signed in — progress is shown read-only rather than lost. */
    private val _isGuest = MutableStateFlow(false)
    val isGuest: StateFlow<Boolean> = _isGuest.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    init {
        refreshProgress()
    }

    fun refreshProgress() {
        val studentId = AuthRepository.currentUserId()
        if (studentId == null) {
            // No auth flow has run yet. Show the hub rather than an endless
            // spinner, and make it clear progress won't be saved.
            _isGuest.value = true
            _stats.value = PlayerStats()
            return
        }
        _isGuest.value = false
        viewModelScope.launch {
            runCatching { GameProgressRepository.progressSummary() }
                .onSuccess { summary ->
                    _stats.value = PlayerProgression.statsFor(summary.completedCount)
                    _badges.value = summary.tracksCompleted
                        .mapNotNull { track -> GameRoom.entries.firstOrNull { it.track == track } }
                        .toSet()
                }
                .onFailure { _message.value = "Couldn't reach the Hollow. Showing what we have offline." }
        }
    }

    /**
     * Loads a room's quest the first time it's opened and caches it, so walking
     * in and out of a room doesn't re-hit the database.
     */
    fun loadQuest(room: GameRoom, force: Boolean = false) {
        val existing = _quests.value[room]
        if (!force && existing != null && existing !is QuestUiState.Failed) return

        _quests.update { it + (room to QuestUiState.Loading) }
        viewModelScope.launch {
            runCatching { GameProgressRepository.nextQuest(room.track) }
                .onSuccess { quest ->
                    _quests.update {
                        it + (room to if (quest == null) QuestUiState.AllCaughtUp
                                      else QuestUiState.Available(quest))
                    }
                }
                .onFailure {
                    _quests.update {
                        it + (room to QuestUiState.Failed("Adeline couldn't fetch today's quest."))
                    }
                }
        }
    }

    /**
     * Takes a quest on. This records that the student *started* the lesson —
     * XP, coins and badges are deliberately not granted here, because
     * [GameProgressRepository.progressSummary] counts finished lessons. Paying
     * out on accept would light up the HUD and then have the next refresh take
     * it straight back off the student.
     *
     * The button state is still flipped optimistically so the tap feels
     * instant, and rolled back if the write doesn't land.
     */
    fun acceptQuest(room: GameRoom) {
        val current = _quests.value[room] as? QuestUiState.Available ?: return
        if (current.accepted) return

        val studentId = AuthRepository.currentUserId()
        if (studentId == null) {
            _message.value = "Sign in to save your quest progress."
            return
        }

        _quests.update { it + (room to current.copy(accepted = true)) }

        viewModelScope.launch {
            runCatching { GameProgressRepository.acceptQuest(studentId, current.quest.lessonId) }
                .onSuccess { refreshProgress() }
                .onFailure {
                    _quests.update { it + (room to current.copy(accepted = false)) }
                    _message.value = "That quest didn't save. Check your connection and try again."
                }
        }
    }

    fun consumeMessage() { _message.value = null }
}
