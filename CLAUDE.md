# Adelinemobile — Claude & AI Studio Instructions

## Project Overview

**Dear Adeline** is an Android app (Kotlin + Jetpack Compose) that serves as a homeschooling planner, AI mentor, and digital portfolio for K-12 students. It uses Gemini AI (via Firebase AI / `GeminiApiService`) as its primary AI backend and Supabase as its database.

- **App ID:** `com.aistudio.dearadeline.hxwqzt`
- **Min SDK:** 24 | **Target SDK:** 36
- **Package root:** `com/example/`
- **Build system:** Gradle (Kotlin DSL), AGP 9.1.1, Kotlin 2.2.10

## Architecture

```
app/src/main/java/com/example/
├── data/                   # Data layer
│   ├── GeminiApiService.kt     # Gemini AI calls
│   ├── SupabaseClient.kt       # Supabase connection
│   ├── SupabaseRepositories.kt # Data access
│   ├── ChatRepository.kt       # Chat persistence
│   ├── CurriculumEngine.kt     # Lesson planning logic
│   ├── ActivityLogEngine.kt    # Activity tracking
│   ├── ScriptureEngine.kt      # Scripture/devotional content
│   ├── FirestoreCurriculumService.kt
│   └── GameProgressRepository.kt
├── ui/
│   ├── game/               # Gamified learning UI
│   │   ├── GameViewModel.kt
│   │   ├── HubScreen.kt
│   │   ├── RoomScreen.kt
│   │   └── ...
│   └── theme/              # Material3 theme (Color, Type, Theme)
├── MainActivity.kt
├── OnboardingScreen.kt
├── CurriculumScreen.kt
├── DashboardWidgets.kt
├── PortfolioScreen.kt
├── MemoryBrainScreen.kt
├── WorkbookViewScreen.kt
└── GraduationTrackerScreen.kt
```

## Key Dependencies

| Library | Purpose |
|---|---|
| `firebase-ai` | Gemini AI calls via Firebase |
| `firebase-firestore` | Cloud data sync |
| `firebase-appcheck-recaptcha` | App integrity |
| `supabase-postgrest` + `supabase-auth` | Database & auth |
| `androidx-room` | Local offline database |
| `retrofit` + `moshi` | HTTP & JSON |
| `kotlinx-serialization-json` | Serialization |
| `navigation-compose` | Screen routing |
| `material3` | UI components |
| `roborazzi` | Screenshot tests |

## Environment / Secrets

Secrets are injected via the **Secrets Gradle Plugin** — it reads `.env` (git-ignored) and falls back to `.env.example`.

- **`GEMINI_API_KEY`** — injected by AI Studio at runtime; configure via AI Studio's Secrets panel. Uncomment in `.env.example` if using directly.
- **`SUPABASE_URL`** — `https://gyxowttfwqbajoapfebf.supabase.co`
- **`SUPABASE_ANON_KEY`** — publishable/safe to ship in APK; RLS enforced server-side
- **`KEYSTORE_PATH` / `STORE_PASSWORD` / `KEY_PASSWORD`** — release signing via env vars

Never commit `.env`. Never commit `google-services.json` or any `.jks` keystore.

## AI Studio Integration

This project was originally created in **Google AI Studio** and has an `assets/.aistudio/` directory used by AI Studio's project context. The `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.

When working in AI Studio:
- The `GEMINI_API_KEY` is automatically injected — do not hardcode it
- Use the Secrets panel to manage API keys
- `update_dashboard.py` and `update_main.py` are AI Studio utility scripts — run them from the project root

## Claude Code Guidance

### Do
- Read existing screens before adding new ones — patterns are established in `CurriculumScreen.kt`, `DashboardWidgets.kt`, etc.
- Follow the existing MVVM pattern: ViewModels in `ui/game/GameViewModel.kt`, repositories in `data/`
- Use `@Composable` functions consistent with existing Material3 usage
- Keep Gemini calls inside `GeminiApiService.kt` — do not scatter API calls across screens
- Use Supabase for persistent user data; Room for offline/local cache
- Run `./gradlew test` before claiming anything works

### Don't
- Don't add Firebase Auth unless uncommenting all three related dependencies together (see `build.gradle.kts` comments)
- Don't modify `assets/.aistudio/` — managed by AI Studio
- Don't hardcode secrets or API keys anywhere in source
- Don't change `applicationId` — it ties to Firebase and Play Store
- Don't enable minification (`isMinifyEnabled`) without testing — currently off

### Build Commands
```bash
./gradlew assembleDebug          # Build debug APK
./gradlew assembleRelease        # Build release APK (needs signing env vars)
./gradlew test                   # Unit tests
./gradlew connectedAndroidTest   # Instrumented tests (needs device/emulator)
./gradlew recordRoborazziDebug   # Capture screenshot baselines
./gradlew verifyRoborazziDebug   # Compare screenshots to baselines
```

## Screen Navigation Map

`MainActivity` → `NavHost` routing:
- `onboarding` → `OnboardingScreen`
- `dashboard` → `DashboardWidgets`
- `curriculum` → `CurriculumScreen`
- `portfolio` → `PortfolioScreen`
- `memory` → `MemoryBrainScreen`
- `workbook` → `WorkbookViewScreen`
- `graduation` → `GraduationTrackerScreen`
- `game/*` → `GameNavHost` (Hub → Rooms)
