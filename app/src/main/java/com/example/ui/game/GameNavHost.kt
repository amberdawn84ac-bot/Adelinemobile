package com.example.ui.game

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

private const val ROUTE_HUB = "hollow/hub"
private const val ROUTE_ROOM = "hollow/room/{roomId}"

/**
 * Adeline's Hollow, wired end to end: HUD and satchel frame the stage, the
 * hub and rooms swap with a portal-style zoom, and the quest card reads from
 * the shared Supabase database through [GameViewModel].
 */
@Composable
fun AdelinesHollow(
    onExit: () -> Unit = {},
    viewModel: GameViewModel = viewModel()
) {
    val navController = rememberNavController()
    val stats by viewModel.stats.collectAsStateWithLifecycle()
    val badges by viewModel.badges.collectAsStateWithLifecycle()
    val quests by viewModel.quests.collectAsStateWithLifecycle()
    val isGuest by viewModel.isGuest.collectAsStateWithLifecycle()
    val message by viewModel.message.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }
    var openQuestRoom by remember { mutableStateOf<GameRoom?>(null) }

    LaunchedEffect(message) {
        message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background,
        contentWindowInsets = WindowInsets(0, 0, 0, 0)
    ) { _ ->
        Column(modifier = Modifier.fillMaxSize()) {
            GameHud(stats = stats, isGuest = isGuest)

            Box(modifier = Modifier.weight(1f)) {
                NavHost(
                    navController = navController,
                    startDestination = ROUTE_HUB,
                    // Stepping through a doorway zooms in; coming back zooms out.
                    enterTransition = { scaleIn(tween(320), initialScale = 0.92f) + fadeIn(tween(320)) },
                    exitTransition = { scaleOut(tween(280), targetScale = 1.06f) + fadeOut(tween(280)) },
                    popEnterTransition = { scaleIn(tween(320), initialScale = 1.06f) + fadeIn(tween(320)) },
                    popExitTransition = { scaleOut(tween(280), targetScale = 0.92f) + fadeOut(tween(280)) }
                ) {
                    composable(ROUTE_HUB) {
                        HubScreen(
                            badges = badges,
                            onEnterRoom = { room ->
                                viewModel.loadQuest(room)
                                navController.navigate("hollow/room/${room.id}")
                            },
                            onTalkToAdeline = {
                                // From the hub Adeline points at the first room
                                // still holding an unfinished quest.
                                val next = GameRoom.entries.firstOrNull { it !in badges }
                                    ?: GameRoom.entries.first()
                                viewModel.loadQuest(next)
                                openQuestRoom = next
                            }
                        )
                    }

                    composable(ROUTE_ROOM) { entry ->
                        val room = GameRoom.fromId(entry.arguments?.getString("roomId"))
                        if (room == null) {
                            LaunchedEffect(Unit) { navController.popBackStack() }
                        } else {
                            LaunchedEffect(room) { viewModel.loadQuest(room) }
                            RoomScreen(
                                room = room,
                                onBackToHub = { navController.popBackStack() },
                                onTalkToAdeline = { openQuestRoom = room }
                            )
                        }
                    }
                }
            }

            InventoryBar(
                badges = badges,
                onSlotTap = { room ->
                    viewModel.loadQuest(room)
                    navController.navigate("hollow/room/${room.id}")
                }
            )
        }

        openQuestRoom?.let { room ->
            val state = quests[room] ?: QuestUiState.Loading
            QuestSheet(
                room = room,
                state = state,
                onAccept = {
                    QuestSfx.playAccept()
                    viewModel.acceptQuest(room)
                },
                onRetry = { viewModel.loadQuest(room, force = true) },
                onDismiss = { openQuestRoom = null }
            )
        }
    }
}
