package com.example

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.CurriculumEngine
import com.example.data.LessonWorkbook
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkbookViewScreen(
    workbook: LessonWorkbook,
    curriculumId: String?,
    curriculumEngine: CurriculumEngine,
    onBack: () -> Unit,
    onCompletionSuccess: () -> Unit
) {
    var activeTab by remember { mutableStateOf(0) }
    val tabTitles = listOf("Fred Story", "Feynman Method", "Spoken Lesson", "Experiments", "My Journal", "Portfolio Page")
    val tabIcons = listOf(
        Icons.Rounded.MenuBook,
        Icons.Rounded.TipsAndUpdates,
        Icons.Rounded.RecordVoiceOver,
        Icons.Rounded.Science,
        Icons.Rounded.Edit,
        Icons.Rounded.WorkspacePremium
    )

    val coroutineScope = rememberCoroutineScope()
    var isSaving by remember { mutableStateOf(false) }
    var showPrintDialog by remember { mutableStateOf(false) }

    // Prepare journal answers list matching the number of prompts
    val journalAnswers = remember { 
        mutableStateListOf<String>().apply {
            repeat(workbook.journalPrompts.size) { add("") }
        }
    }

    // Warm cream background to resemble beautiful notebook paper
    val paperColor = Color(0xFFFCF8F2)
    val marginLineColor = Color(0xFFEF9A9A) // Soft red/pink notebook margin line
    val ruledLineColor = Color(0xFFBBDEFB) // Soft blue ruled lines

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(workbook.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Adeline's Life of Fred & Feynman Workbook Series", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close Workbook")
                    }
                },
                actions = {
                    IconButton(onClick = { showPrintDialog = true }) {
                        Icon(Icons.Rounded.Print, contentDescription = "Print/Save PDF")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.primary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        containerColor = paperColor
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Badges indicating grade level and academic subjects
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        workbook.gradeLevel,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        fontWeight = FontWeight.Bold
                    )
                }
                Surface(
                    color = MaterialTheme.colorScheme.tertiaryContainer,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        workbook.subjectArea,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Scrollable Tab row with icons
            ScrollableTabRow(
                selectedTabIndex = activeTab,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary,
                edgePadding = 16.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = activeTab == index,
                        onClick = { activeTab = index },
                        text = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(tabIcons[index], contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(title, style = MaterialTheme.typography.labelLarge)
                            }
                        }
                    )
                }
            }

            // Notebook page with red vertical margin line
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(16.dp)
                    .background(Color.White, RoundedCornerShape(16.dp))
                    .border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(16.dp))
            ) {
                // Background paper canvas drawing vertical margin red line
                Canvas(modifier = Modifier.fillMaxSize()) {
                    // Draw red notebook margin line (standard notebook position: 48dp/72dp from left edge)
                    val xPos = 48.dp.toPx()
                    drawLine(
                        color = marginLineColor,
                        start = Offset(xPos, 0f),
                        end = Offset(xPos, size.height),
                        strokeWidth = 2.dp.toPx()
                    )
                }

                // Inner content, padded to stay to the right of the red margin line
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(start = 56.dp, end = 16.dp, top = 16.dp, bottom = 16.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    when (activeTab) {
                        0 -> StoryTabContent(workbook)
                        1 -> FeynmanTabContent(workbook)
                        2 -> SpokenLessonTabContent(workbook)
                        3 -> ExperimentsTabContent(workbook)
                        4 -> JournalTabContent(workbook, journalAnswers)
                        5 -> PortfolioPageContent(
                            workbook = workbook,
                            journalAnswers = journalAnswers,
                            isSaving = isSaving,
                            onComplete = {
                                isSaving = true
                                coroutineScope.launch {
                                    curriculumEngine.completeWorkbookAndLog(workbook, journalAnswers.toList())
                                    if (curriculumId != null) {
                                        val workbookStr = kotlinx.serialization.json.Json.encodeToString(
                                            LessonWorkbook.serializer(), workbook
                                        )
                                        curriculumEngine.updateCanonicalWorkbook(curriculumId, workbookStr)
                                    }
                                    isSaving = false
                                    onCompletionSuccess()
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    if (showPrintDialog) {
        PrintPdfSimulatorDialog(
            workbook = workbook,
            journalAnswers = journalAnswers.toList(),
            onDismiss = { showPrintDialog = false }
        )
    }
}

@Composable
fun StoryTabContent(workbook: LessonWorkbook) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(Icons.Rounded.MenuBook, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                workbook.storyTitle,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
        
        Surface(
            color = Color(0xFFFFFDE7),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
                .border(1.dp, Color(0xFFFFF59D), RoundedCornerShape(12.dp))
        ) {
            Row(modifier = Modifier.padding(12.dp)) {
                Icon(Icons.Rounded.School, contentDescription = null, tint = Color(0xFFFBC02D))
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    "Style: Whimsical storytelling ('Life of Fred' style) integrating complex curriculum seamlessly inside a humorous, narrative-driven adventure.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF5D4037)
                )
            }
        }

        Text(
            workbook.storyContent,
            style = MaterialTheme.typography.bodyLarge,
            lineHeight = 28.sp,
            fontFamily = FontFamily.Serif,
            color = Color(0xFF2C3E50),
            modifier = Modifier.padding(top = 12.dp)
        )
    }
}

@Composable
fun FeynmanTabContent(workbook: LessonWorkbook) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(Icons.Rounded.TipsAndUpdates, contentDescription = null, tint = Color(0xFFFFB300))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "The Feynman Breakdown",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        Surface(
            color = Color(0xFFE8F5E9),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp)
                .border(1.dp, Color(0xFFA5D6A7), RoundedCornerShape(12.dp))
        ) {
            Row(modifier = Modifier.padding(12.dp)) {
                Icon(Icons.Rounded.Lightbulb, contentDescription = null, tint = Color(0xFF2E7D32))
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    "Feynman Method: Explaining deep core concepts using incredibly simple analogies to guarantee perfect foundational clarity.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF1B5E20)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F8E9)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "How to think about this simply:",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF33691E)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    workbook.feynmanExplanation,
                    style = MaterialTheme.typography.bodyLarge,
                    lineHeight = 26.sp,
                    fontFamily = FontFamily.Serif,
                    color = Color(0xFF3E2723)
                )
            }
        }
    }
}

@Composable
fun SpokenLessonTabContent(workbook: LessonWorkbook) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(Icons.Rounded.RecordVoiceOver, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "Textbook & Lecture Script",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        Text(
            "Parents can read this aloud to their students, or younger/independent readers can study this complete text block as their canonical lesson study content.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        Surface(
            color = Color(0xFFECEFF1),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Icon(
                    Icons.Rounded.FormatQuote,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.secondary.copy(alpha = 0.5f),
                    modifier = Modifier.size(32.dp)
                )
                Text(
                    workbook.readAloudLecture,
                    style = MaterialTheme.typography.bodyLarge,
                    lineHeight = 28.sp,
                    fontStyle = FontStyle.Italic,
                    fontFamily = FontFamily.Serif,
                    color = Color(0xFF263238),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}

@Composable
fun ExperimentsTabContent(workbook: LessonWorkbook) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(Icons.Rounded.Science, contentDescription = null, tint = MaterialTheme.colorScheme.tertiary)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "Hands-On Laboratory & Projects",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        Text(
            "Complete these physical kitchen-science or homestead lab activities to trigger deep cognitive associations!",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        workbook.experiments.forEachIndexed { index, exp ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "${index + 1}. ${exp.title}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Text("🛒 MATERIALS NEEDED:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                    exp.materials.forEach { material ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 2.dp, horizontal = 4.dp)
                        ) {
                            Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.tertiary)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(material, style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text("📋 STEP-BY-STEP STEPS:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                    exp.steps.forEachIndexed { sIdx, step ->
                        Row(modifier = Modifier.padding(vertical = 4.dp, horizontal = 4.dp)) {
                            Text("${sIdx + 1}.", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(step, style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Surface(
                        color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("🔬 ACADEMIC INSIGHT:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onTertiaryContainer)
                            Text(exp.educationalInsight, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onTertiaryContainer)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun JournalTabContent(workbook: LessonWorkbook, answers: MutableList<String>) {
    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(Icons.Rounded.Edit, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "Student Interactive Journal",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        Text(
            "Write down your hypotheses, lab logs, or answers to these conceptual questions below. These will be added to your permanent academic portfolio!",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        workbook.journalPrompts.forEachIndexed { index, prompt ->
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                Text(
                    "Question ${index + 1}: $prompt",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))
                OutlinedTextField(
                    value = if (index < answers.size) answers[index] else "",
                    onValueChange = { if (index < answers.size) answers[index] = it },
                    placeholder = { Text("Write your observations/thoughts here...") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = Color(0xFFFAFAFA),
                        focusedContainerColor = Color.White
                    )
                )
            }
        }
    }
}

@Composable
fun PortfolioPageContent(
    workbook: LessonWorkbook,
    journalAnswers: List<String>,
    isSaving: Boolean,
    onComplete: () -> Unit
) {
    var completedSuccessfully by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.Rounded.WorkspacePremium,
            contentDescription = null,
            tint = Color(0xFFD4AF37), // Gold
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            "Portfolio Summary & Standards",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            textAlign = TextAlign.Center
        )
        Text(
            "Review your completed lesson page, map to academic standards, and store it in your cloud/local portfolio library for school compliance records.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
        )

        Divider(modifier = Modifier.padding(vertical = 16.dp))

        // Aligned Standards Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.AssignmentTurnedIn, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Aligned Academic Standards:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                workbook.standardsAligned.forEach { standard ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        Icon(Icons.Rounded.StarRate, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFFFFA000))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(standard, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Portfolio Summary Paragraph
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF0E6)), // Warm wood/paper card
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, Color(0xFFE6D2C0))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    "Official Academic Credit Summary:",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF5D4037)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    workbook.portfolioSummary,
                    style = MaterialTheme.typography.bodyMedium,
                    lineHeight = 22.sp,
                    fontFamily = FontFamily.Serif,
                    color = Color(0xFF3E2723)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (completedSuccessfully) {
            Surface(
                color = Color(0xFFE8F5E9),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(32.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Module Completed!", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                        Text("Workbook stored in portfolio and shared to canonical library for other students!", style = MaterialTheme.typography.bodySmall, color = Color(0xFF2E7D32))
                    }
                }
            }
        } else {
            Button(
                onClick = {
                    onComplete()
                    completedSuccessfully = true
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(26.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                ),
                enabled = !isSaving
            ) {
                if (isSaving) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Icon(Icons.Rounded.WorkspacePremium, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add to Portfolio & Canonical Library", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun PrintPdfSimulatorDialog(
    workbook: LessonWorkbook,
    journalAnswers: List<String>,
    onDismiss: () -> Unit
) {
    var hasPrinted by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f),
            shape = RoundedCornerShape(16.dp),
            color = Color.White
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "PDF / Printable Worksheets",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close Preview")
                    }
                }

                Divider(modifier = Modifier.padding(vertical = 12.dp))

                // Scrollable clean sheet simulating a standard physical paper printable template
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .background(Color(0xFFF9F9F9), RoundedCornerShape(8.dp))
                        .border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(8.dp))
                        .verticalScroll(rememberScrollState())
                        .padding(24.dp)
                ) {
                    Text(
                        "ADELINE'S CURRICULUM COMPLIANCE SHEET",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.Gray,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        workbook.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.Black,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text(
                        "Target: ${workbook.gradeLevel} • Subject Area: ${workbook.subjectArea}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.DarkGray,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                    Divider(color = Color.Black, thickness = 2.dp)
                    Spacer(modifier = Modifier.height(16.dp))

                    Text("📖 LIFE OF FRED LESSON STORY:", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = Color.Black)
                    Text(
                        workbook.storyContent,
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = FontFamily.Serif,
                        color = Color.Black,
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                    )

                    Text("💡 FEYNMAN EXPLANATION:", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = Color.Black)
                    Text(
                        workbook.feynmanExplanation,
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = FontFamily.Serif,
                        color = Color.Black,
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                    )

                    Text("🧪 EXPERIMENTS COMPLETED:", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = Color.Black)
                    workbook.experiments.forEachIndexed { index, exp ->
                        Text(
                            "Lab ${index + 1}: ${exp.title}",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                        Text(
                            "Materials used: " + exp.materials.joinToString(", ") + "\nInsight: " + exp.educationalInsight,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.DarkGray,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }

                    Text("✍️ STUDENT JOURNAL ENTRIES:", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = Color.Black)
                    workbook.journalPrompts.forEachIndexed { index, prompt ->
                        val ans = if (index < journalAnswers.size) journalAnswers[index] else "_________________"
                        Text(
                            "Q: $prompt\nStudent Answer: $ans",
                            style = MaterialTheme.typography.bodySmall,
                            fontFamily = FontFamily.Serif,
                            color = Color.Black,
                            modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = Color.Gray, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(12.dp))

                    Text("🏆 STANDARDS COMPLIANCE & PORTFOLIO INCLUSION", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = Color.Black)
                    Text(
                        "Aligned Standards: " + workbook.standardsAligned.joinToString(", "),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                    Text(
                        workbook.portfolioSummary,
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = FontFamily.Serif,
                        color = Color.Black,
                        modifier = Modifier.padding(top = 4.dp)
                    )

                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        "APPROVED FOR PORTFOLIO INCLUSION BY ADELINE'S ACADEMIC ENGINE",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.DarkGray,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (hasPrinted) {
                    Surface(
                        color = Color(0xFFE8F5E9),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                    ) {
                        Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Rounded.Print, contentDescription = null, tint = Color(0xFF2E7D32))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Workbook document exported! Sent to system printer successfully.", style = MaterialTheme.typography.bodySmall, color = Color(0xFF1B5E20))
                        }
                    }
                }

                Button(
                    onClick = { hasPrinted = true },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Rounded.Print, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Print Workbook Document")
                }
            }
        }
    }
}
