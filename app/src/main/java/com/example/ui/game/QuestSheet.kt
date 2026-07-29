package com.example.ui.game

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Paid
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/**
 * Adeline's dialogue card. Opens when the student taps her, and presents the
 * room's quest with an Accept action that fires the chime and records progress.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuestSheet(
    room: GameRoom,
    state: QuestUiState,
    onAccept: () -> Unit,
    onRetry: () -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AdelinePortrait(size = 84.dp)

            Text(
                text = "ADELINE SAYS",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            when (state) {
                is QuestUiState.Loading -> Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 140.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = room.accent)
                }

                is QuestUiState.AllCaughtUp -> {
                    Text(
                        "You've cleared every quest in the ${room.displayName}!",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        color = room.accentDeep
                    )
                    Text(
                        "Come back when new lessons arrive, or try another room.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    TextButton(onClick = onDismiss) { Text("Back to the map") }
                }

                is QuestUiState.Failed -> {
                    Text(
                        state.message,
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        "Check your connection — your progress is safe.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Button(
                        onClick = onRetry,
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 52.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = room.accent)
                    ) { Text("Try again") }
                }

                is QuestUiState.Available -> {
                    Text(
                        state.quest.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        color = room.accentDeep
                    )
                    Text(
                        state.quest.topic,
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        RewardChip(
                            icon = { Icon(Icons.Rounded.Star, null, Modifier.size(16.dp)) },
                            label = "+${PlayerProgression.XP_PER_QUEST} XP"
                        )
                        RewardChip(
                            icon = { Icon(Icons.Rounded.Paid, null, Modifier.size(16.dp)) },
                            label = "+${PlayerProgression.COINS_PER_QUEST} coins"
                        )
                        if (state.quest.blockCount > 0) {
                            RewardChip(
                                icon = { Icon(Icons.Rounded.CheckCircle, null, Modifier.size(16.dp)) },
                                label = "${state.quest.blockCount} steps"
                            )
                        }
                    }

                    Button(
                        onClick = onAccept,
                        enabled = !state.accepted,
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = room.accent,
                            disabledContainerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text(
                            if (state.accepted) "Quest accepted!" else "Accept Quest",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RewardChip(icon: @Composable () -> Unit, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(horizontal = 12.dp, vertical = 7.dp)
    ) {
        icon()
        Text(label, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
    }
}
