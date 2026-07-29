package com.example

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.data.CanonicalCurriculum
import com.example.data.CurriculumEngine
import com.example.data.LessonPlan
import com.example.data.CanonicalActivity
import com.example.data.LessonWorkbook
import androidx.compose.ui.window.Dialog
import kotlinx.serialization.json.Json
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CurriculumScreen(curriculumEngine: CurriculumEngine, onBack: () -> Unit) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Custom Generator", "Cloud Library")
    
    val lessonPlans by curriculumEngine.lessonPlans.collectAsState()
    val canonicalCurriculums by curriculumEngine.canonicalCurriculums.collectAsState(initial = emptyList())
    val isLoading by curriculumEngine.isLoading.collectAsState()
    val isCloudSyncing by curriculumEngine.isCloudSyncing.collectAsState()
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var activeWorkbook by remember { mutableStateOf<LessonWorkbook?>(null) }
    var activeCurriculumId by remember { mutableStateOf<String?>(null) }
    var isGeneratingWorkbook by remember { mutableStateOf(false) }

    if (activeWorkbook != null) {
        WorkbookViewScreen(
            workbook = activeWorkbook!!,
            curriculumId = activeCurriculumId,
            curriculumEngine = curriculumEngine,
            onBack = { activeWorkbook = null },
            onCompletionSuccess = {
                activeWorkbook = null
                coroutineScope.launch {
                    snackbarHostState.showSnackbar("Workbook completed! Added to your portfolio.")
                }
            }
        )
        return
    }

    if (isGeneratingWorkbook) {
        Dialog(onDismissRequest = {}) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.padding(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Writing workbook & textbook pages...",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Creating Fred-style narrative lesson text & hands-on laboratory projects.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Project Library", style = MaterialTheme.typography.titleLarge)
                        Text("Canonical Curriculum Engine", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            coroutineScope.launch {
                                curriculumEngine.syncWithCloud()
                                snackbarHostState.showSnackbar("Synced with Cloud Library!")
                            }
                        },
                        enabled = !isCloudSyncing
                    ) {
                        if (isCloudSyncing) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(Icons.Rounded.CloudSync, contentDescription = "Sync Cloud")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.primary,
                    navigationIconContentColor = MaterialTheme.colorScheme.primary
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Tab row for Generator vs Cloud Library
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { 
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (index == 0) Icons.Rounded.Create else Icons.Rounded.Cloud,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(title, style = MaterialTheme.typography.labelLarge)
                            }
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            when (selectedTab) {
                0 -> GeneratorTab(
                    lessonPlans = lessonPlans,
                    isLoading = isLoading,
                    onGenerate = { interest ->
                        coroutineScope.launch {
                            curriculumEngine.generateLessonPlan(interest)
                        }
                    },
                    onPublish = { plan, grade, interest ->
                        coroutineScope.launch {
                            val success = curriculumEngine.publishToLibrary(
                                title = plan.title,
                                description = plan.description,
                                activities = plan.activities,
                                gradeLevel = grade,
                                interests = interest
                            )
                            if (success) {
                                snackbarHostState.showSnackbar("Published lesson successfully to Cloud Library!")
                            } else {
                                snackbarHostState.showSnackbar("Saved locally! (Will sync to Cloud when connected)")
                            }
                        }
                    },
                    onOpenWorkbook = { plan ->
                        isGeneratingWorkbook = true
                        activeCurriculumId = plan.id
                        coroutineScope.launch {
                            val generated = curriculumEngine.generateWorkbookForPlan(
                                title = plan.title,
                                description = plan.description,
                                activitiesList = plan.activities.map { CanonicalActivity(it.title, it.creditType, it.description) },
                                gradeLevel = "5th Grade"
                            )
                            isGeneratingWorkbook = false
                            if (generated != null) {
                                activeWorkbook = generated
                            } else {
                                snackbarHostState.showSnackbar("Unable to generate workbook. Check internet connection.")
                            }
                        }
                    }
                )
                1 -> CloudLibraryTab(
                    canonicalCurriculums = canonicalCurriculums,
                    isLoading = isLoading,
                    onAdaptLesson = { original, grade, interest ->
                        coroutineScope.launch {
                            val adapted = curriculumEngine.adaptCurriculum(original, grade, interest)
                            if (adapted != null) {
                                selectedTab = 0 // Switch to display adapted lesson
                                snackbarHostState.showSnackbar("Lesson adapted for $grade level interested in $interest!")
                            } else {
                                snackbarHostState.showSnackbar("Failed to adapt lesson. Check API key.")
                            }
                        }
                    },
                    onOpenWorkbook = { curriculum ->
                        val existingWorkbook = curriculum.workbookJson?.let {
                            try {
                                Json.decodeFromString<LessonWorkbook>(it)
                            } catch (e: Exception) {
                                null
                            }
                        }
                        if (existingWorkbook != null) {
                            activeCurriculumId = curriculum.id
                            activeWorkbook = existingWorkbook
                        } else {
                            isGeneratingWorkbook = true
                            activeCurriculumId = curriculum.id
                            coroutineScope.launch {
                                val generated = curriculumEngine.generateWorkbookForPlan(
                                    title = curriculum.title,
                                    description = curriculum.description,
                                    activitiesList = curriculum.activities,
                                    gradeLevel = curriculum.originalGradeLevel
                                )
                                isGeneratingWorkbook = false
                                if (generated != null) {
                                    activeWorkbook = generated
                                } else {
                                    snackbarHostState.showSnackbar("Unable to generate workbook. Check internet connection.")
                                }
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun GeneratorTab(
    lessonPlans: List<LessonPlan>,
    isLoading: Boolean,
    onGenerate: (String) -> Unit,
    onPublish: (LessonPlan, String, String) -> Unit,
    onOpenWorkbook: (LessonPlan) -> Unit
) {
    var interestInput by remember { mutableStateOf("") }
    var showPublishDialog by remember { mutableStateOf<LessonPlan?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Text(
            text = "Generate a New Project",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        
        OutlinedTextField(
            value = interestInput,
            onValueChange = { interestInput = it },
            placeholder = { Text("e.g. Baking bread, Fixing a bicycle, Botany...") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedContainerColor = MaterialTheme.colorScheme.surface
            ),
            trailingIcon = {
                IconButton(
                    onClick = {
                        if (interestInput.isNotBlank()) {
                            onGenerate(interestInput)
                            interestInput = ""
                        }
                    },
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.primary, strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Rounded.AutoAwesome, contentDescription = "Generate", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        if (lessonPlans.isEmpty() && !isLoading) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Rounded.MenuBook, 
                    contentDescription = null, 
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "No custom lessons generated yet.",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    "Type an interest above to convert any real-world hobby into academic credit!",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 16.dp)
            ) {
                items(lessonPlans) { plan ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(plan.title, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary, modifier = Modifier.weight(1f))
                                
                                Button(
                                    onClick = { showPublishDialog = plan },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.primary,
                                        contentColor = MaterialTheme.colorScheme.onPrimary
                                    ),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Rounded.Publish, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Store in Cloud", style = MaterialTheme.typography.labelSmall)
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(plan.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.secondary)
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            plan.activities.forEach { activity ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.tertiary)
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(activity.title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Surface(
                                                color = MaterialTheme.colorScheme.secondaryContainer,
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Text(
                                                    activity.creditType,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(activity.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { onOpenWorkbook(plan) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Rounded.MenuBook, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Study Mini-Workbook")
                            }
                        }
                    }
                }
            }
        }
    }

    if (showPublishDialog != null) {
        val plan = showPublishDialog!!
        var gradeLevel by remember { mutableStateOf("5th Grade") }
        var interestsLabel by remember { mutableStateOf("Hands-on") }

        AlertDialog(
            onDismissRequest = { showPublishDialog = null },
            title = { Text("Publish to Shared Library") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "This publishes your custom lesson to the non-local library, making it permanently available to be tweaked or adapted for other grade levels or interests!",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    OutlinedTextField(
                        value = gradeLevel,
                        onValueChange = { gradeLevel = it },
                        label = { Text("Target Grade Level") },
                        placeholder = { Text("e.g. 5th Grade, High School") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = interestsLabel,
                        onValueChange = { interestsLabel = it },
                        label = { Text("Tags / Interests") },
                        placeholder = { Text("e.g. Sourdough, Chemistry") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onPublish(plan, gradeLevel, interestsLabel)
                        showPublishDialog = null
                    }
                ) {
                    Text("Publish to Cloud")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPublishDialog = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun CloudLibraryTab(
    canonicalCurriculums: List<CanonicalCurriculum>,
    isLoading: Boolean,
    onAdaptLesson: (CanonicalCurriculum, String, String) -> Unit,
    onOpenWorkbook: (CanonicalCurriculum) -> Unit
) {
    var showAdaptDialog by remember { mutableStateOf<CanonicalCurriculum?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.3f)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Rounded.Cloud, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "These canonical lesson plans are stored not locally (cloud repository). You can recall them instantly and adapt them dynamically for other students!",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSecondaryContainer
                )
            }
        }

        if (isLoading) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator()
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Adapting lesson structure, please wait...", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                }
            }
        } else if (canonicalCurriculums.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Text("Library is empty. Generate a custom lesson and publish it!", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 24.dp)
            ) {
                items(canonicalCurriculums) { curriculum ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(curriculum.title, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.padding(top = 4.dp)
                                    ) {
                                        Surface(
                                            color = MaterialTheme.colorScheme.primaryContainer,
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text(
                                                curriculum.originalGradeLevel,
                                                style = MaterialTheme.typography.labelSmall,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                        Surface(
                                            color = MaterialTheme.colorScheme.tertiaryContainer,
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text(
                                                curriculum.originalInterests,
                                                style = MaterialTheme.typography.labelSmall,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }
                                
                                Button(
                                    onClick = { showAdaptDialog = curriculum },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.secondary,
                                        contentColor = MaterialTheme.colorScheme.onSecondary
                                    )
                                ) {
                                    Icon(Icons.Rounded.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Tweak & Adapt")
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(curriculum.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            curriculum.activities.forEach { activity ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Rounded.Adjust, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(activity.title, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSurface)
                                        Text(activity.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { onOpenWorkbook(curriculum) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Rounded.MenuBook, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Study Mini-Workbook")
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAdaptDialog != null) {
        val curriculum = showAdaptDialog!!
        var targetGradeLevel by remember { mutableStateOf("3rd Grade") }
        var targetInterests by remember { mutableStateOf("Space Travel") }

        AlertDialog(
            onDismissRequest = { showAdaptDialog = null },
            title = { Text("Tweak & Adapt Curriculum") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "Adeline will pull this canonical curriculum: \"${curriculum.title}\" and rewrite/tune all lessons and academic subjects to match your new target student profile!",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    
                    OutlinedTextField(
                        value = targetGradeLevel,
                        onValueChange = { targetGradeLevel = it },
                        label = { Text("New Target Grade Level") },
                        placeholder = { Text("e.g. 8th Grade, High School") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    
                    OutlinedTextField(
                        value = targetInterests,
                        onValueChange = { targetInterests = it },
                        label = { Text("New Student Interests") },
                        placeholder = { Text("e.g. Space exploration, Dinosaurs, Coding") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onAdaptLesson(curriculum, targetGradeLevel, targetInterests)
                        showAdaptDialog = null
                    }
                ) {
                    Text("Adapt Now")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAdaptDialog = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}
