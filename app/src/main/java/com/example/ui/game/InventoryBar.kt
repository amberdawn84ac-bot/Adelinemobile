package com.example.ui.game

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

/**
 * The satchel across the bottom of the screen: one slot per room, filled in as
 * the student earns that track's badge. Slots stay at least 48dp so they're
 * comfortable targets on a phone.
 */
@Composable
fun InventoryBar(
    badges: Set<GameRoom>,
    onSlotTap: (GameRoom) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surfaceVariant,
        shadowElevation = 8.dp,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Row(
            modifier = Modifier
                .navigationBarsPadding()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically
        ) {
            GameRoom.entries.forEach { room ->
                InventorySlot(
                    room = room,
                    earned = room in badges,
                    onClick = { onSlotTap(room) },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun InventorySlot(
    room: GameRoom,
    earned: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val label = if (earned) "${room.displayName} badge, earned"
                else "${room.displayName} badge, not yet earned"

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(
                if (earned) room.accent.copy(alpha = 0.20f)
                else MaterialTheme.colorScheme.background
            )
            .clickable(onClick = onClick)
            .padding(10.dp)
            .semantics { contentDescription = label }
    ) {
        Icon(
            imageVector = room.icon,
            contentDescription = null,
            tint = if (earned) room.accentDeep
                   else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f),
            modifier = Modifier.size(24.dp)
        )
    }
}
