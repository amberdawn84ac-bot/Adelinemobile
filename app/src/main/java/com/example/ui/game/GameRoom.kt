package com.example.ui.game

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountBalance
import androidx.compose.material.icons.rounded.Agriculture
import androidx.compose.material.icons.rounded.Calculate
import androidx.compose.material.icons.rounded.LocalLibrary
import androidx.compose.material.icons.rounded.MenuBook
import androidx.compose.material.icons.rounded.Science
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

/**
 * A themed room in Adeline's Hollow.
 *
 * Every room is a doorway onto one of the curriculum tracks that already exist
 * in the shared Supabase database, so a room's quests are real `CanonicalLesson`
 * rows rather than hard-coded content. Adding a room is a matter of adding an
 * entry here — the hub grid, navigation graph and inventory bar all build
 * themselves from this list.
 */
enum class GameRoom(
    val id: String,
    val displayName: String,
    val tagline: String,
    /** Value of the Postgres `Track` enum this room draws its lessons from. */
    val track: String,
    val icon: ImageVector,
    val accent: Color,
    val accentDeep: Color
) {
    SCIENCE_LAB(
        id = "science",
        displayName = "Science Lab",
        tagline = "Bubbling beakers and big questions.",
        track = "CREATION_SCIENCE",
        icon = Icons.Rounded.Science,
        accent = Color(0xFF2F8F83),
        accentDeep = Color(0xFF1F6459)
    ),
    MATH_WORKBENCH(
        id = "math",
        displayName = "Math Workbench",
        tagline = "Numbers, puzzles and a busy workbench.",
        track = "APPLIED_MATHEMATICS",
        icon = Icons.Rounded.Calculate,
        accent = Color(0xFF4D5AA0),
        accentDeep = Color(0xFF35406F)
    ),
    HISTORY_ARCHIVES(
        id = "history",
        displayName = "History Archives",
        tagline = "Dusty scrolls and very old stories.",
        track = "TRUTH_HISTORY",
        icon = Icons.Rounded.MenuBook,
        accent = Color(0xFFA3653F),
        accentDeep = Color(0xFF7C4A2C)
    ),
    FARM_MARKET(
        id = "farm",
        displayName = "Farm & Market",
        tagline = "Trade crops, count coins, grow things.",
        track = "HOMESTEADING",
        icon = Icons.Rounded.Agriculture,
        accent = Color(0xFF7A9B3F),
        accentDeep = Color(0xFF5A7526)
    ),
    LIBRARY(
        id = "library",
        displayName = "Library",
        tagline = "Quiet corners and a lost chapter.",
        track = "ENGLISH_LITERATURE",
        icon = Icons.Rounded.LocalLibrary,
        accent = Color(0xFF7D5490),
        accentDeep = Color(0xFF5C3D6B)
    ),
    JUSTICE_CENTER(
        id = "justice",
        displayName = "Justice Center",
        tagline = "Fair rules and tricky decisions.",
        track = "JUSTICE_CHANGEMAKING",
        icon = Icons.Rounded.AccountBalance,
        accent = Color(0xFF47617A),
        accentDeep = Color(0xFF324759)
    );

    companion object {
        fun fromId(id: String?): GameRoom? = entries.firstOrNull { it.id == id }
    }
}
