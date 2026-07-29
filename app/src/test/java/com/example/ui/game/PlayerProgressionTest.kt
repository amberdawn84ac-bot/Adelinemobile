package com.example.ui.game

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The progression curve is the one piece of game logic the web app has to
 * mirror exactly, so it's pinned down here.
 */
class PlayerProgressionTest {

    @Test
    fun `a new student starts at level one with no progress`() {
        val stats = PlayerProgression.statsFor(0)
        assertEquals(1, stats.level)
        assertEquals(0, stats.xpIntoLevel)
        assertEquals(0, stats.coins)
        assertEquals(0f, stats.levelProgress, 0.001f)
    }

    @Test
    fun `eight quests is exactly enough to reach level two`() {
        // 8 quests * 25 XP = 200 XP, which is the level 1 threshold.
        val stats = PlayerProgression.statsFor(8)
        assertEquals(2, stats.level)
        assertEquals(0, stats.xpIntoLevel)
        assertEquals(PlayerProgression.xpForLevel(2), stats.xpForNextLevel)
    }

    @Test
    fun `one quest short of levelling stays on level one`() {
        val stats = PlayerProgression.statsFor(7)
        assertEquals(1, stats.level)
        assertEquals(175, stats.xpIntoLevel)
    }

    @Test
    fun `each level costs more than the one before it`() {
        for (level in 1..20) {
            assertTrue(
                "level ${level + 1} should cost more than level $level",
                PlayerProgression.xpForLevel(level + 1) > PlayerProgression.xpForLevel(level)
            )
        }
    }

    @Test
    fun `coins track completed quests one for one`() {
        assertEquals(0, PlayerProgression.statsFor(0).coins)
        assertEquals(120, PlayerProgression.statsFor(12).coins)
    }

    @Test
    fun `progress fraction always stays inside the bar`() {
        for (completed in 0..200) {
            val p = PlayerProgression.statsFor(completed).levelProgress
            assertTrue("progress out of range at $completed quests: $p", p in 0f..1f)
        }
    }

    @Test
    fun `a negative count is treated as no progress rather than crashing`() {
        val stats = PlayerProgression.statsFor(-5)
        assertEquals(1, stats.level)
        assertEquals(0, stats.coins)
    }
}
