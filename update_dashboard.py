import re

with open("app/src/main/java/com/example/DashboardWidgets.kt", "r") as f:
    content = f.read()

daily_bread_replacement = """@Composable
fun DailyBreadWidget(scriptureEngine: com.example.data.ScriptureEngine) {
    val dailyScripture by scriptureEngine.dailyScripture.collectAsState()
    val isLoading by scriptureEngine.isLoading.collectAsState()
    Card(
        modifier = Modifier
            .width(260.dp)
            .height(140.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.MenuBook, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Daily Bread", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.secondary)
            }
            Spacer(modifier = Modifier.height(12.dp))
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.primary, strokeWidth = 2.dp)
            } else {
                Text(
                    dailyScripture,
                    style = MaterialTheme.typography.bodyMedium,
                    fontStyle = FontStyle.Italic,
                    maxLines = 4
                )
            }
        }
    }
}
"""

content = re.sub(r"@Composable\nfun DailyBreadWidget\(scriptureEngine\) \{.*?(?=@Composable\nfun GoalProgressWidget)", daily_bread_replacement, content, flags=re.DOTALL)

if "import androidx.compose.runtime.collectAsState" not in content:
    content = content.replace("import androidx.compose.runtime.Composable", "import androidx.compose.runtime.Composable\nimport androidx.compose.runtime.collectAsState\nimport androidx.compose.runtime.getValue")

with open("app/src/main/java/com/example/DashboardWidgets.kt", "w") as f:
    f.write(content)
