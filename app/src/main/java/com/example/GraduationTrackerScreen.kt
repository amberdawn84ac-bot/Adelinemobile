package com.example

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class AgeGroup {
    K_5_EXPLORER,
    JR_ADVENTURER,
    HIGH_SCHOLAR
}

data class GoalItem(
    val text: String,
    val subject: String,
    val initialCompleted: Boolean = false
)

data class Milestone(
    val title: String,
    val subtitle: String,
    val isCompleted: Boolean,
    val icon: ImageVector
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GraduationTrackerScreen(onBack: () -> Unit) {
    var selectedGroup by rememberSaveable { mutableStateOf(AgeGroup.K_5_EXPLORER) }

    // Hardcoded initial list of goals per age group
    val explorerGoals = remember {
        mutableStateListOf(
            GoalItem("Read 20 books together or aloud", "Literacy", true),
            GoalItem("Perform 10 outdoor nature/science logs", "Biology", false),
            GoalItem("Complete 8 kitchen baking/cooking activities", "Chemistry", true),
            GoalItem("Document 5 practical building/fixing actions", "Physics", false),
            GoalItem("Practice basic storytelling & creative writing", "Language Arts", false)
        )
    }

    val adventurerGoals = remember {
        mutableStateListOf(
            GoalItem("Log 30 hours of applied STEM / carpentry", "Engineering", false),
            GoalItem("Complete 6 structured history depth-studies", "Civics", true),
            GoalItem("Draft 3 original research or creative essays", "Arts", false),
            GoalItem("Contribute to a community service project", "Social Studies", false),
            GoalItem("Examine financial basics & homestead math", "Home Economics", true)
        )
    }

    val scholarGoals = remember {
        mutableStateListOf(
            GoalItem("Earn 4.0 credits of original-text ELA", "Language Arts", true),
            GoalItem("Earn 3.0 credits of applied Mathematics", "Mathematics", false),
            GoalItem("Earn 3.0 credits of Natural & Physical Sciences", "Sciences", true),
            GoalItem("Earn 3.0 credits of History & Civics", "Social Studies", false),
            GoalItem("Complete year-end Capstone Portfolio Review", "Graduation", false)
        )
    }

    // Get current goals list and state
    val currentGoals = when (selectedGroup) {
        AgeGroup.K_5_EXPLORER -> explorerGoals
        AgeGroup.JR_ADVENTURER -> adventurerGoals
        AgeGroup.HIGH_SCHOLAR -> scholarGoals
    }

    // Calculate dynamic progress
    val completedCount = currentGoals.count { it.initialCompleted }
    val progress = if (currentGoals.isNotEmpty()) completedCount.toFloat() / currentGoals.size else 0f

    // Milestones for the timeline
    val milestones = when (selectedGroup) {
        AgeGroup.K_5_EXPLORER -> listOf(
            Milestone("Curriculum Spark", "Core learning interests set with Adeline", true, Icons.Rounded.Lightbulb),
            Milestone("Hand-On Learner", "Documented first chemistry/baking project", true, Icons.Rounded.Cookie),
            Milestone("Nature Scout", "Recorded 5 outdoor observations", false, Icons.Rounded.Grass),
            Milestone("Storyteller Master", "Completed ELA portfolio and final project", false, Icons.Rounded.MenuBook),
            Milestone("Year-End Celebration!", "Elementary showcase with Adeline", false, Icons.Rounded.Celebration)
        )
        AgeGroup.JR_ADVENTURER -> listOf(
            Milestone("Discovery Path Set", "Applied learning goals defined", true, Icons.Rounded.Explore),
            Milestone("Tech & Carpentry Maker", "Logged 15 hours of mechanics or building", true, Icons.Rounded.Handyman),
            Milestone("Historical Explorer", "Investigated original historical sources", false, Icons.Rounded.MenuBook),
            Milestone("Civic Pioneer", "Designed and ran a community project", false, Icons.Rounded.Group),
            Milestone("Year-End Review", "Adeline evaluates core competencies", false, Icons.Rounded.CheckCircle)
        )
        AgeGroup.HIGH_SCHOLAR -> listOf(
            Milestone("Graduation Map Active", "Mapped courses to State & Adeline standards", true, Icons.Rounded.Map),
            Milestone("Underclassman Milestones", "Accumulated 12.0 core academic credits", true, Icons.Rounded.Class),
            Milestone("Applied STEM Thesis", "Designed and analyzed a functional physical apparatus", false, Icons.Rounded.Science),
            Milestone("Civic & Constitutional Jury", "Reviewed historical legislation and documents", false, Icons.Rounded.Gavel),
            Milestone("Capstone Defense", "High School graduation & portfolio review", false, Icons.Rounded.School)
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Graduation & Goals", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.primary
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 32.dp)
        ) {
            item {
                Text(
                    text = "My Progress Path",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "A beautiful, transparent roadmap detailing current goals and the journey towards graduation or your year-end milestone.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
                )
            }

            // Tabs for levels
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        AgeGroupTab(
                            title = "K-5 Explorer",
                            isSelected = selectedGroup == AgeGroup.K_5_EXPLORER,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedGroup = AgeGroup.K_5_EXPLORER }
                        )
                        AgeGroupTab(
                            title = "6-8 Adventurer",
                            isSelected = selectedGroup == AgeGroup.JR_ADVENTURER,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedGroup = AgeGroup.JR_ADVENTURER }
                        )
                        AgeGroupTab(
                            title = "9-12 Scholar",
                            isSelected = selectedGroup == AgeGroup.HIGH_SCHOLAR,
                            modifier = Modifier.weight(1f),
                            onClick = { selectedGroup = AgeGroup.HIGH_SCHOLAR }
                        )
                    }
                }
            }

            // Big progress visual
            item {
                LevelProgressVisual(
                    group = selectedGroup,
                    progress = progress,
                    completed = completedCount,
                    total = currentGoals.size
                )
            }

            // Timeline Map
            item {
                Text(
                    text = "Learning Path Roadmap",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            item {
                RoadmapTimelineCard(milestones = milestones)
            }

            // Checklist section
            item {
                Text(
                    text = "Core Year-End Goals",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 8.dp)
                )
                Text(
                    text = "Check off goals as you and Adeline review lessons and log real-world portfolios.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.padding(top = 2.dp, bottom = 8.dp)
                )
            }

            itemsIndexed(currentGoals) { index, goal ->
                GoalChecklistItem(
                    goal = goal,
                    onToggle = {
                        val updatedGoal = goal.copy(initialCompleted = !goal.initialCompleted)
                        currentGoals[index] = updatedGoal
                    }
                )
            }

            // Automation notification
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.06f))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.AutoAwesome,
                            contentDescription = "Adeline Automation",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(
                                text = "Intelligent Portfolios",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Adeline automatically processes your hands-on activities in the background, issuing corresponding credits straight toward these milestone targets.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AgeGroupTab(
    title: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1
        )
    }
}

@Composable
fun LevelProgressVisual(
    group: AgeGroup,
    progress: Float,
    completed: Int,
    total: Int
) {
    val levelName = when (group) {
        AgeGroup.K_5_EXPLORER -> "Level: K-5 Explorer"
        AgeGroup.JR_ADVENTURER -> "Level: 6-8 Adventurer"
        AgeGroup.HIGH_SCHOLAR -> "Level: 9-12 Scholar"
    }

    val milestoneGoalText = when (group) {
        AgeGroup.K_5_EXPLORER -> "Path to Elementary Year-End"
        AgeGroup.JR_ADVENTURER -> "Path to Middle School Milestone"
        AgeGroup.HIGH_SCHOLAR -> "Path to High School Graduation"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f))
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = levelName,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = milestoneGoalText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "$completed / $total Goals",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(12.dp)
                    .clip(RoundedCornerShape(6.dp)),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${(progress * 100).toInt()}% Journey Completed",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.secondary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = if (progress >= 1f) "Ready for Advancement!" else "Keep Learning!",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (progress >= 1f) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                )
            }
        }
    }
}

@Composable
fun RoadmapTimelineCard(milestones: List<Milestone>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
        border = CardDefaults.outlinedCardBorder().copy(width = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            milestones.forEachIndexed { index, milestone ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.width(36.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(
                                    if (milestone.isCompleted)
                                        MaterialTheme.colorScheme.primary
                                    else
                                        MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (milestone.isCompleted) Icons.Rounded.Done else milestone.icon,
                                contentDescription = null,
                                tint = if (milestone.isCompleted)
                                    MaterialTheme.colorScheme.onPrimary
                                else
                                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        if (index < milestones.size - 1) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Box(
                                modifier = Modifier
                                    .width(2.dp)
                                    .height(32.dp)
                                    .background(
                                        if (milestone.isCompleted && milestones[index + 1].isCompleted)
                                            MaterialTheme.colorScheme.primary
                                        else
                                            MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                                    )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = milestone.title,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (milestone.isCompleted)
                                MaterialTheme.colorScheme.onSurface
                            else
                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            textDecoration = if (milestone.isCompleted) TextDecoration.None else TextDecoration.None
                        )
                        Text(
                            text = milestone.subtitle,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun GoalChecklistItem(
    goal: GoalItem,
    onToggle: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onToggle),
        colors = CardDefaults.cardColors(
            containerColor = if (goal.initialCompleted)
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)
            else
                MaterialTheme.colorScheme.surface
        ),
        border = CardDefaults.outlinedCardBorder().copy(
            width = 1.dp,
            brush = if (goal.initialCompleted)
                androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.primary.copy(alpha = 0.4f))
            else
                androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(
                        if (goal.initialCompleted)
                            MaterialTheme.colorScheme.primary
                        else
                            Color.Transparent
                    )
                    .border(
                        width = 1.5.dp,
                        color = if (goal.initialCompleted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                        shape = RoundedCornerShape(6.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (goal.initialCompleted) {
                    Icon(
                        imageVector = Icons.Rounded.Done,
                        contentDescription = "Completed",
                        tint = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = goal.text,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    color = if (goal.initialCompleted)
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    else
                        MaterialTheme.colorScheme.onSurface,
                    textDecoration = if (goal.initialCompleted) TextDecoration.LineThrough else TextDecoration.None
                )
                Text(
                    text = goal.subject,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (goal.initialCompleted)
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.7f)
                    else
                        MaterialTheme.colorScheme.secondary,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
