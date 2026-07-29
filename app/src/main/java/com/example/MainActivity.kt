package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.data.ChatMessage
import com.example.data.ChatRepository
import com.example.ui.theme.AppTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            com.google.firebase.FirebaseApp.initializeApp(this)
        } catch (e: Exception) {
            android.util.Log.w("MainActivity", "Default FirebaseApp initialization failed, trying manual setup: ${e.message}")
            try {
                val options = com.google.firebase.FirebaseOptions.Builder()
                    .setApplicationId("1:1234567890:android:1234567890")
                    .setApiKey("fake_api_key_for_offline_fallback")
                    .setProjectId("fake-project-id")
                    .build()
                com.google.firebase.FirebaseApp.initializeApp(this, options)
            } catch (ex: Exception) {
                android.util.Log.e("MainActivity", "Failed to initialize Firebase with fallback options", ex)
            }
        }
        enableEdgeToEdge()
        val database = com.example.data.DearAdelineDatabase.getDatabase(this)
        val chatRepository = ChatRepository(database.dao())
        val curriculumEngine = com.example.data.CurriculumEngine(database.dao())
        val activityLogEngine = com.example.data.ActivityLogEngine(database.dao())
        val scriptureEngine = com.example.data.ScriptureEngine(this)
        
        lifecycleScope.launch { scriptureEngine.fetchDailyScripture() }
        lifecycleScope.launch { activityLogEngine.reviewUnprocessedActivities() }

        setContent {
            AppTheme {
                val navController = rememberNavController()
                NavHost(navController = navController, startDestination = "onboarding") {
                    composable("onboarding") {
                        OnboardingScreen(onStartAdventure = { navController.navigate("dashboard") })
                    }
                    composable("dashboard") {
                        DearAdelineApp(
                            chatRepository = chatRepository,
                            scriptureEngine = scriptureEngine,
                            onNavigateToGraduation = { navController.navigate("graduation") },
                            onNavigateToCurriculum = { navController.navigate("curriculum") },
                            onNavigateToPortfolio = { navController.navigate("portfolio") }
                        )
                    }
                    composable("graduation") {
                        GraduationTrackerScreen { navController.popBackStack() }
                    }
                    composable("curriculum") {
                        CurriculumScreen(curriculumEngine = curriculumEngine) { navController.popBackStack() }
                    }
                    composable("portfolio") {
                        PortfolioScreen(activityLogEngine = activityLogEngine) { navController.popBackStack() }
                    }
                    composable("memory_brain") {
                        MemoryBrainScreen(chatRepository = chatRepository) { navController.popBackStack() }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DearAdelineApp(
    chatRepository: ChatRepository,
    scriptureEngine: com.example.data.ScriptureEngine,
    onNavigateToGraduation: () -> Unit,
    onNavigateToCurriculum: () -> Unit,
    onNavigateToPortfolio: () -> Unit
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val coroutineScope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = MaterialTheme.colorScheme.surface,
                modifier = Modifier.width(280.dp)
            ) {
                Spacer(Modifier.height(16.dp))
                Text(
                    "Dear Adeline",
                    style = MaterialTheme.typography.displaySmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(16.dp)
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                Spacer(Modifier.height(16.dp))
                
                DrawerItem("Dashboard", Icons.Rounded.Home, true) { coroutineScope.launch { drawerState.close() } }
                DrawerItem("Portfolio", Icons.Rounded.Folder, false) { 
                    coroutineScope.launch { drawerState.close() }
                    onNavigateToPortfolio()
                }
                DrawerItem("Project Library", Icons.Rounded.LibraryBooks, false) { 
                    coroutineScope.launch { drawerState.close() }
                    onNavigateToCurriculum()
                }
                DrawerItem("Career Discovery", Icons.Rounded.Work, false) { coroutineScope.launch { drawerState.close() } }
                DrawerItem("Graduation Tracker", Icons.Rounded.School, false) { 
                    coroutineScope.launch { drawerState.close() }
                    onNavigateToGraduation()
                }
                
                Spacer(Modifier.weight(1f))
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                DrawerItem("Settings", Icons.Rounded.Settings, false) { coroutineScope.launch { drawerState.close() } }
                Spacer(Modifier.height(16.dp))
            }
        }
    ) {
        MainScreen(chatRepository, scriptureEngine) {
            coroutineScope.launch {
                drawerState.open()
            }
        }
    }
}

@Composable
fun DrawerItem(label: String, icon: ImageVector, isSelected: Boolean, onClick: () -> Unit) {
    val backgroundColor = if (isSelected) MaterialTheme.colorScheme.secondaryContainer else Color.Transparent
    val contentColor = if (isSelected) MaterialTheme.colorScheme.onSecondaryContainer else MaterialTheme.colorScheme.onSurface
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = contentColor)
        Spacer(modifier = Modifier.width(16.dp))
        Text(label, style = MaterialTheme.typography.labelLarge, color = contentColor)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(chatRepository: ChatRepository, scriptureEngine: com.example.data.ScriptureEngine, onMenuClick: () -> Unit) {
    var textInput by remember { mutableStateOf("") }
    val messages by chatRepository.messages.collectAsState(initial = emptyList())
    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AI Mentor", style = MaterialTheme.typography.titleLarge) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.primary
                ),
                navigationIcon = {
                    IconButton(onClick = onMenuClick) {
                        Icon(Icons.Rounded.Menu, contentDescription = "Menu", tint = MaterialTheme.colorScheme.primary)
                    }
                },
                actions = {
                    IconButton(onClick = { /* TODO: Open Profile */ }) {
                        Icon(Icons.Rounded.Person, contentDescription = "Profile", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            DashboardWidgetsRow(scriptureEngine)

            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(messages) { message ->
                    ChatBubble(message)
                }
            }

            // Input Area
            Surface(
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 2.dp,
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .navigationBarsPadding(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = textInput,
                        onValueChange = { textInput = it },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Message Adeline...") },
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedContainerColor = MaterialTheme.colorScheme.background,
                            focusedContainerColor = MaterialTheme.colorScheme.background
                        ),
                        maxLines = 3
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    FloatingActionButton(
                        onClick = {
                            if (textInput.isNotBlank()) {
                                val msg = textInput
                                textInput = ""
                                coroutineScope.launch {
                                    chatRepository.sendMessage(msg)
                                }
                            }
                        },
                        containerColor = MaterialTheme.colorScheme.secondary,
                        contentColor = MaterialTheme.colorScheme.onSecondary,
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(Icons.Filled.Send, contentDescription = "Send")
                    }
                }
            }
        }
    }
}

@Composable
fun ChatBubble(message: ChatMessage) {
    val alignment = if (message.isFromUser) Alignment.CenterEnd else Alignment.CenterStart
    val backgroundColor = if (message.isFromUser) 
        MaterialTheme.colorScheme.primary 
    else 
        MaterialTheme.colorScheme.surface
    val textColor = if (message.isFromUser) 
        MaterialTheme.colorScheme.onPrimary 
    else 
        MaterialTheme.colorScheme.onSurface

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = alignment
    ) {
        Surface(
            color = backgroundColor,
            shape = RoundedCornerShape(
                topStart = 20.dp,
                topEnd = 20.dp,
                bottomStart = if (message.isFromUser) 20.dp else 4.dp,
                bottomEnd = if (message.isFromUser) 4.dp else 20.dp
            ),
            shadowElevation = if (message.isFromUser) 0.dp else 1.dp,
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            if (message.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .padding(16.dp)
                        .size(24.dp),
                    color = MaterialTheme.colorScheme.secondary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = message.text,
                    modifier = Modifier.padding(16.dp),
                    color = textColor,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }
    }
}
