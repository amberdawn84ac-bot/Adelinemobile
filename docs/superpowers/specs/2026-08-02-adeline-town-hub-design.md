# Adeline's Town — Hub World Redesign
**Date:** 2026-08-02
**Status:** Approved
**Replaces:** 10-room hardcoded portal system

---

## Context

Adelinemobile started with 10 hardcoded portals, each locked to a specific subject track. Now that the brain service is fully integrated (gap detection, lesson streaming, transcript recording), the static portal-to-subject mapping is the wrong model. Kids want Roblox/Fortnite-style exploration and choice. The curriculum should be kid-led — the brain picks *what* they need, the kid picks *how* they engage. The town metaphor (inspired by real adventures with great-grandma Adeline) replaces the abstract portal grid.

---

## Vision

A 2D walkable town where every building has a personality and activity type, but the brain dynamically fills each building with the right content for that specific kid on that specific day. Adeline greets them at the town entrance each session, sparks their curiosity, then heads back to her Kitchen. Kids explore freely, pick buildings, choose how they want to learn, and earn their way to deeper content and mini-games.

---

## Town Buildings

| Building | Vibe | Activity Types | Tracks (loose) | Unlocks At |
|---|---|---|---|---|
| **Adeline's Kitchen** | Warm, home base | Chat with Adeline, daily spark | All | Always |
| **The Library** | Quiet, curious | Story Mode, Explore, Watch & Discuss | History, English, Discipleship | Level 1 |
| **The Arena** | Energetic, competitive | Quiz Me, Brain Battle mini-game, challenges | All subjects | Level 1 |
| **The Maker's Lab** | Tinkering, building | Build It, projects, hands-on missions | Math, Science, Creative Economy | Level 1 |
| **The Creek & Woods** | Wild, adventurous | Scavenger hunts, nature missions, explore | Science, Health, Homesteading | Level 1 |
| **The Market** | Real-world, practical | Scenarios, roleplay, economy sim | Economics, Homesteading, Justice | Level 3 |
| **The Chapel** | Reflective, peaceful | Story Mode, journaling, discussion | Discipleship, Truth/History | Level 5 |

Buildings can be added over time as the town grows. Locked buildings show "Coming Soon" with a level requirement.

---

## Architecture

### Hub World (HubWorld.tsx)
- 2D walkable town replaces the current open field with portals
- WASD movement stays the same
- Each building is a `TownBuilding` component (replaces `RoomPortal`)
- Proximity check (same 12% distance logic) + E key to enter
- On hub load: one greeting call to `/conversation/stream` with intent `greeting` — Adeline appears at town entrance, says something personal based on kid's recent activity + gaps, then returns to her Kitchen

### Building Entry Flow
1. Kid presses E at a building
2. App calls `GET /learning-path/{student_id}/gaps` → gets next recommended standard + track
3. Activity picker card appears: building name + 2-3 relevant activity type buttons
4. Kid picks their mode
5. `POST /lesson/stream` called with track + standard + activity mode
6. Mission runs in existing `RoomMission` component (or new `QuizMode` / `MiniGame` for those modes)
7. On completion: `recordCompletion()` + `recordTranscriptCredit()` as today

### Adeline's Kitchen (Special Case)
- No gap check on entry
- Opens full chat interface using `POST /conversation/stream` (SSE)
- Brain passes student context (transcript, gaps, recent missions) automatically
- Kid can ask for suggestions, get help, or just talk

### Fallback
If brain is unavailable, each building falls back to 2-3 hardcoded starter missions (same pattern as current `RoomMission` fallbacks). Game never breaks.

---

## Data & Types

### Replace `HUB_PORTALS` in `types/game.ts` with `TOWN_BUILDINGS`:

```typescript
type ActivityType = 'story_mode' | 'quiz_me' | 'build_it' | 'explore' | 'mini_game'

interface TownBuilding {
  id: string
  name: string
  emoji: string
  color: string
  position: { x: number; y: number }  // percent of world
  activityTypes: ActivityType[]
  unlockLevel: number
  description: string  // shown on hover/entry card
}
```

### Remove
- `RoomId` type union (hardcoded room IDs)
- `ROOM_CONFIG` in `GameShell.tsx` (hardcoded track mapping per room)
- `HUB_PORTALS` array in `types/game.ts`

### Keep
- All 10 `Track` values — still used by brain + transcript
- `LifeMapEntry`, `TRACK_LABELS`, `TRACK_COLORS`
- XP, AdeCoins, all reward logic

---

## Activity Picker UI

When a kid enters a building, a card overlays the game:

```
┌─────────────────────────────────┐
│  🔧 The Maker's Lab             │
│  "Your next challenge: Fractions"│
│                                  │
│  How do you want to tackle it?   │
│  [ Build It ]  [ Quiz Me ]  [ 🎮 ] │
└─────────────────────────────────┘
```

- Title = building name
- Subtitle = brain's suggested topic (from gaps endpoint)
- Buttons = building's `activityTypes`
- Mini-game button (🎮) only shows if unlocked

---

## Progression & Unlocks

- **XP levels** stay as-is (Supabase `student.xp`)
- Buildings check `xp` against `unlockLevel` threshold (e.g., Level 3 = 500 XP)
- Locked buildings visible in world but show lock icon + "Unlock at Level X"
- Mini-games unlock after completing 3+ missions in that building
- Building-specific tokens (Arena Tokens, Maker Chips, etc.) earned per mission — spent on harder game modes or avatar cosmetics

---

## Mini-Games (v1 scope)

**Ship in v1:**
- **Brain Battle** (The Arena) — solo timed quiz, rapid-fire questions from brain, score tracked

**Ship as Coming Soon in v1, build in v2:**
- Blueprint Builder (Maker's Lab)
- Scavenger Hunt (Creek & Woods)
- Story Remix (Library)
- Trade Day (Market)

---

## Files to Create / Modify

### Modify
- `src/types/game.ts` — replace `HUB_PORTALS` / `RoomId` with `TownBuilding` / `ActivityType`
- `src/components/world/HubWorld.tsx` — new town map layout, `TownBuilding` components, Adeline greeting on load
- `src/pages/GameShell.tsx` — remove `ROOM_CONFIG`, add building entry → activity picker → mode routing
- `src/lib/brainClient.ts` — add `getGaps()`, `streamConversation()` functions

### Create
- `src/components/world/TownBuilding.tsx` — building visual + proximity detection
- `src/components/game/ActivityPicker.tsx` — modal card shown on building entry
- `src/components/game/AdelineGreeting.tsx` — entrance greeting with SSE chat
- `src/components/game/BrainBattle.tsx` — Arena mini-game
- `src/pages/AdelineKitchen.tsx` — full chat interface with Adeline

### Remove (eventually)
- `src/components/world/RoomPortal.tsx` — replaced by `TownBuilding`
- `src/components/rooms/MathMines.tsx`, `StoryForest.tsx`, `ScienceLab.tsx`, `HomesteadFarm.tsx`, `TruthArchive.tsx` — replaced by brain-driven content

---

## Verification

1. Kid loads hub → Adeline greeting fires, she appears at entrance, says something personal
2. Kid walks to Maker's Lab, presses E → gap check fires → activity picker shows with topic from brain
3. Kid picks "Build It" → lesson streams in via `RoomMission`
4. Kid completes → XP awarded, transcript credit recorded, life map entry created
5. Kid walks to Adeline's Kitchen → full chat opens, can ask "what should I do next?"
6. Brain Battle in Arena → questions come from brain, score tracked
7. Parent Dashboard → transcript shows credits earned across buildings (not rooms)
8. If brain is down → fallback missions work in every building
