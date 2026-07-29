import sys

with open("app/src/main/java/com/example/MainActivity.kt", "r") as f:
    content = f.read()

# Add curriculum engine instantiation
content = content.replace("val chatRepository = ChatRepository()", "val chatRepository = ChatRepository()\n        val curriculumEngine = com.example.data.CurriculumEngine()")

# Add to NavHost
nav_host_replacement = """NavHost(navController = navController, startDestination = "onboarding") {
                    composable("onboarding") {
                        OnboardingScreen(onStartAdventure = { navController.navigate("dashboard") })
                    }
                    composable("dashboard") {
                        DearAdelineApp(
                            chatRepository = chatRepository,
                            onNavigateToGraduation = { navController.navigate("graduation") },
                            onNavigateToCurriculum = { navController.navigate("curriculum") }
                        )
                    }
                    composable("graduation") {
                        GraduationTrackerScreen { navController.popBackStack() }
                    }
                    composable("curriculum") {
                        CurriculumScreen(curriculumEngine = curriculumEngine) { navController.popBackStack() }
                    }
                }"""
content = content.replace('NavHost(navController = navController, startDestination = "onboarding") {\n                    composable("onboarding") {\n                        OnboardingScreen(onStartAdventure = { navController.navigate("dashboard") })\n                    }\n                    composable("dashboard") {\n                        DearAdelineApp(chatRepository) {\n                            navController.navigate("graduation")\n                        }\n                    }\n                    composable("graduation") {\n                        GraduationTrackerScreen { navController.popBackStack() }\n                    }\n                }', nav_host_replacement)

# Update DearAdelineApp arguments
content = content.replace("fun DearAdelineApp(chatRepository: ChatRepository, onNavigateToGraduation: () -> Unit)", "fun DearAdelineApp(chatRepository: ChatRepository, onNavigateToGraduation: () -> Unit, onNavigateToCurriculum: () -> Unit)")

# Update drawer actions
drawer_lib_replacement = """DrawerItem("Project Library", Icons.Rounded.LibraryBooks, false) { 
                    coroutineScope.launch { drawerState.close() }
                    onNavigateToCurriculum()
                }"""
content = content.replace('DrawerItem("Project Library", Icons.Rounded.LibraryBooks, false) { coroutineScope.launch { drawerState.close() } }', drawer_lib_replacement)

with open("app/src/main/java/com/example/MainActivity.kt", "w") as f:
    f.write(content)
