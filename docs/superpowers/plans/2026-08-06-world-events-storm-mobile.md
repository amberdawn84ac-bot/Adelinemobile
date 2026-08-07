# World Events — The Storm — Adelinemobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Adelinemobile up to the new brain storm endpoints — a countdown/rebuild banner in the hub, and building-specific storm content that replaces normal missions during the warning window.

**Architecture:** New hand-authored `STORM_MISSIONS` content constant (mirrors the existing `TOWN_BUILDINGS[].fallbackMissions` shape). `RoomMission` gets a new optional `stormMission` prop that short-circuits its existing brain-generation/fallback logic when present. `GameShell` fetches storm status alongside the town data it already fetches, renders a banner, and passes the right storm mission down when a kid enters a building during the warning window.

**Tech Stack:** React 19, TypeScript, Vite — matches the rest of this codebase from prior work this session.

## Global Constraints

- This plan depends on the sibling brain plan (`dearadeline-withlove/docs/superpowers/plans/2026-08-06-world-events-storm-brain.md`) being deployed — built against that exact documented contract.
- No test runner exists in this project — verification is `npx tsc --noEmit` + manual/HTTP-level checks.
- Per the design spec, v1 uses ONLY the hand-authored storm content — do not wire storm missions through `generateLesson` (the brain AI-lesson path). The short-circuit must happen before that call.
- All new brain calls go through the existing `/api/brain/*` proxy (the `PROXY` constant in `brainClient.ts`).
- Storm content only applies when the kid is in a Town (`activeChild.town_id` set) AND the storm phase is `'warning'` — a solo/townless kid sees no storm banner and gets normal missions as today.

---

## File Structure

| File | Change |
|---|---|
| `src/types/game.ts` | Add `STORM_MISSIONS: Record<BuildingId, FallbackMission[]>` constant. |
| `src/lib/brainClient.ts` | Add `StormStatus` type + `getTownStorm`, `postTownStormPrep` functions. |
| `src/components/rooms/RoomMission.tsx` | Add optional `stormMission` prop that short-circuits mission loading. |
| `src/pages/GameShell.tsx` | Fetch storm status, render banner, pass storm mission into `RoomMission`, record prep on completion. |

---

### Task 1: `STORM_MISSIONS` content constant

**Files:**
- Modify: `src/types/game.ts`

**Interfaces:**
- Consumes: `FallbackMission`, `BuildingId` (both already defined earlier in this file).
- Produces: `STORM_MISSIONS: Record<BuildingId, FallbackMission[]>` — consumed by `GameShell.tsx` (Task 4).

- [ ] **Step 1: Add the constant** after the existing `TOWN_BUILDINGS` array (after its closing `]`, before `export type Track = ...`)

```typescript
// World Events: The Storm. Hand-authored storm-prep content per building,
// swapped in for that building's normal missions during the storm's warning
// window. See docs/superpowers/specs/2026-08-06-world-events-storm-design.md.
export const STORM_MISSIONS: Record<BuildingId, FallbackMission[]> = {
  adelines_kitchen: [
    {
      title: 'Stock the Pantry',
      description: 'A storm is coming. Help Adeline figure out what the town needs before it hits.',
      prompt: 'List what a family needs to have on hand before a storm: food, water, and one more thing. How much water does one person need per day? Show your math.',
      tracks: ['HOMESTEADING', 'APPLIED_MATHEMATICS'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_library: [
    {
      title: 'Storm Warning Notice',
      description: 'The town needs a clear, calm warning notice posted before the storm arrives.',
      prompt: 'Write a short storm warning notice for the town. What do people need to know? What should they do first, second, third?',
      tracks: ['ENGLISH_LITERATURE'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'Before Radar',
      description: 'Long before weather satellites, people still had to know a storm was coming.',
      prompt: 'How did people predict or prepare for storms before modern forecasting? Pick one method (animal behavior, cloud patterns, barometers, etc.) and explain how it worked.',
      tracks: ['TRUTH_HISTORY'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_arena: [
    {
      title: 'Water for the Storm',
      description: 'Emergency planning starts with numbers.',
      prompt: 'A family of 4 needs to prepare for 3 days without clean water. If each person needs 1 gallon per day, how much water does the family need total? Show your work.',
      tracks: ['APPLIED_MATHEMATICS'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'Reading the Sky',
      description: 'Falling air pressure is one of the clearest signs a storm is coming.',
      prompt: 'Explain what barometric pressure is and why it drops before a storm. If you had a barometer, what reading would worry you?',
      tracks: ['CREATION_SCIENCE'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_makers_lab: [
    {
      title: 'Brace for Impact',
      description: "A structure that isn't braced for wind can come apart fast.",
      prompt: 'Design a simple way to brace a small shed or greenhouse against high wind. What shape resists wind best? Sketch or describe your bracing and explain why it works.',
      tracks: ['APPLIED_MATHEMATICS', 'CREATION_SCIENCE'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_creek_and_woods: [
    {
      title: 'Protect the Herd',
      description: "Animals and gardens can't take shelter on their own — that's up to you.",
      prompt: "Make a storm plan for an animal and a garden bed: where do they go, what do you check on first, and what could go wrong if you wait too long?",
      tracks: ['HOMESTEADING'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'When the Power Goes Out',
      description: 'Storms knock out power. Sometimes they cause injuries too.',
      prompt: "Name one common storm-related injury and how you'd treat it with no power and no hospital nearby. What natural remedies or basic first aid would you use?",
      tracks: ['HEALTH_NATUROPATHY'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_market: [
    {
      title: 'Price of Fear',
      description: 'Right before the storm, plywood prices at the market suddenly tripled.',
      prompt: "Is it fair for a seller to triple prices right before a storm? Explain both sides — the seller's and the buyer's — then say what you'd do if you ran the market.",
      tracks: ['CREATIVE_ECONOMY', 'GOVERNMENT_ECONOMICS'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'Storm Budget',
      description: 'Emergency supplies cost real money.',
      prompt: "You have 40 AdeCoins to spend on storm supplies. List what you'd buy and how much of your budget each item takes. What would you cut if the price went up?",
      tracks: ['APPLIED_MATHEMATICS'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_chapel: [
    {
      title: 'Fear Not',
      description: 'Storms are frightening. Faith has something to say about fear.',
      prompt: 'Find or recall a Bible verse about fear or trusting God in hard times. Write it out and explain what it means to you right before something scary happens.',
      tracks: ['DISCIPLESHIP'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'Write Your Storm',
      description: 'Everyone has faced something that scared them.',
      prompt: "Write about a time you were scared and how you got through it. What helped? What would you tell someone else going through something scary right now?",
      tracks: ['ENGLISH_LITERATURE'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` from the repo root.
Expected: 0 errors. (`GOVERNMENT_ECONOMICS` and `HOMESTEADING` etc. must already exist as `Track` literals — they do, confirmed against the existing `Track` type in this same file.)

- [ ] **Step 3: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add STORM_MISSIONS content for World Events - The Storm"
```

---

### Task 2: `brainClient.ts` — storm status functions

**Files:**
- Modify: `src/lib/brainClient.ts`

**Interfaces:**
- Consumes: existing `post`, `get`, `PROXY` helpers.
- Produces: `StormStatus` type, `getTownStorm(townId)`, `postTownStormPrep(townId)` — consumed by `GameShell.tsx` (Task 4).

- [ ] **Step 1: Add the type and functions**, appended after the existing Town section (after `patchTownTreasury`)

```typescript
// ── World Events: The Storm ─────────────────────────────────────────────────

export interface StormStatus {
  phase: 'calm' | 'warning' | 'hit'
  cycle: number
  days_until_hit: number
  prep_count: number
  prep_threshold: number
  treasury: number
}

/** Fetch the current storm phase/countdown for a town. Returns null if unreachable. */
export async function getTownStorm(townId: string): Promise<StormStatus | null> {
  return get<StormStatus>(`/towns/${townId}/storm`)
}

/** Record that a town member completed a storm-prep mission. Returns the new prep count, or null on failure. */
export async function postTownStormPrep(townId: string): Promise<number | null> {
  const result = await post<{ prep_count: number }>(`/towns/${townId}/storm/prep`, {})
  return result?.prep_count ?? null
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` from the repo root.
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/brainClient.ts
git commit -m "feat: add getTownStorm, postTownStormPrep to brainClient"
```

---

### Task 3: `RoomMission.tsx` — storm mission short-circuit

**Files:**
- Modify: `src/components/rooms/RoomMission.tsx`

**Interfaces:**
- Consumes: `FallbackMission` type (from `src/types/game.ts`).
- Produces: new optional `stormMission?: FallbackMission` prop, consumed by `GameShell.tsx` (Task 4).

- [ ] **Step 1: Add the import and prop**

Add to the imports at the top:
```typescript
import { Track, GradeBand, FallbackMission } from '../../types/game'
```
(replacing the existing `import { Track, GradeBand } from '../../types/game'` line).

Add `stormMission?: FallbackMission` to the `Props` interface, and destructure it in the component signature:
```typescript
interface Props {
  roomId: string
  roomLabel: string
  roomEmoji: string
  roomTracks: Track[]
  playerName: string
  systemContext: string
  studentId: string | null
  gradeBand: GradeBand
  stormMission?: FallbackMission
  onComplete: (description: string, tracks: Track[], xp: number, coins: number) => void
  onBack: () => void
}
```
```typescript
export default function RoomMission({
  roomId, roomLabel, roomEmoji, roomTracks, playerName,
  systemContext, studentId, gradeBand, stormMission, onComplete, onBack
}: Props) {
```

- [ ] **Step 2: Short-circuit `loadMission` when a storm mission is provided**

Find `async function loadMission() {` and add this check as the very first lines inside the function, before the existing `setLoading(true)`:
```typescript
  async function loadMission() {
    if (stormMission) {
      setMission({ ...stormMission, fromBrain: false })
      setLoading(false)
      return
    }

    setLoading(true)
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` from the repo root.
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/rooms/RoomMission.tsx
git commit -m "feat: add stormMission prop to RoomMission, short-circuits brain/fallback lookup"
```

---

### Task 4: `GameShell.tsx` — storm status, banner, and prep recording

**Files:**
- Modify: `src/pages/GameShell.tsx`

**Interfaces:**
- Consumes: `StormStatus`, `getTownStorm`, `postTownStormPrep` (Task 2); `STORM_MISSIONS` (Task 1); `RoomMission`'s new `stormMission` prop (Task 3).

- [ ] **Step 1: Add imports**

Extend the existing brainClient import line (find `import { updateStudentProfile, patchXP, patchCoins, getSeasonPass, patchSeasonPass, createTown, joinTown, getTown, Town } from '../lib/brainClient'`):
```typescript
import { updateStudentProfile, patchXP, patchCoins, getSeasonPass, patchSeasonPass, createTown, joinTown, getTown, Town, getTownStorm, postTownStormPrep, StormStatus } from '../lib/brainClient'
```

Extend the existing `types/game` import line to add `STORM_MISSIONS`:
```typescript
import { AvatarData, DEFAULT_AVATAR, LifeMapEntry, Track, ActivityType, BuildingId, GradeBand, TOWN_BUILDINGS, STORM_MISSIONS } from '../types/game'
```

- [ ] **Step 2: Add storm status state**

Near the other town-related `useState` declarations:
```typescript
  const [stormStatus, setStormStatus] = useState<StormStatus | null>(null)
```

- [ ] **Step 3: Fetch storm status whenever the town is known**

Add a new `useEffect`, near the existing town-loading effect:
```typescript
  useEffect(() => {
    if (activeChild?.town_id) {
      getTownStorm(activeChild.town_id).then(setStormStatus)
    }
  }, [activeChild?.town_id])
```

- [ ] **Step 4: Compute the active storm mission for the currently-entered building**

Near the other derived values in the component (e.g. near `const buildingMeta = ...` / `const resolvedTrack = ...`), add:
```typescript
  const activeStormMission = stormStatus?.phase === 'warning' && currentBuilding
    ? STORM_MISSIONS[currentBuilding]?.[0]
    : undefined
```

- [ ] **Step 5: Pass it into `RoomMission`**

Find the `<RoomMission ... />` element and add the prop:
```typescript
          <RoomMission
            roomId={currentBuilding}
            roomLabel={buildingMeta.label}
            roomEmoji={buildingMeta.emoji}
            roomTracks={[resolvedTrack]}
            playerName={playerName}
            systemContext={activityTopic ?? `${activityMode} activity in ${buildingMeta.label}`}
            studentId={activeChild?.id ?? null}
            gradeBand={gradeBand}
            stormMission={activeStormMission}
            onComplete={handleMissionComplete}
            onBack={exitToHub}
          />
```

- [ ] **Step 6: Record storm prep on mission completion**

Find `async function handleMissionComplete(...)` and add the prep call after the existing body:
```typescript
  async function handleMissionComplete(description: string, tracks: Track[], xp: number, coins: number) {
    addXP(xp)
    addCoins(coins)
    if (activeChild) {
      const entry = await logActivity(activeChild.id, description, tracks, xp, coins, 'room_mission')
      if (entry) handleLifeMapEntry(entry)
    }
    if (activeStormMission && activeChild?.town_id) {
      postTownStormPrep(activeChild.town_id)
    }
  }
```

- [ ] **Step 7: Add the storm banner**

Find where `<HubWorld ... />` is rendered (inside the hub-screen JSX). Add a banner directly above it, inside the same wrapping container:
```typescript
        {stormStatus && stormStatus.phase === 'warning' && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-800/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur">
            ⛈️ Storm in {stormStatus.days_until_hit} day{stormStatus.days_until_hit === 1 ? '' : 's'} — visit a building to help the town prepare
          </div>
        )}
        {stormStatus && stormStatus.phase === 'hit' && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 bg-emerald-700/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur">
            🌤️ The storm has passed. Rebuild and get ready for the next one.
          </div>
        )}
        <HubWorld
          avatarData={avatarData}
          playerName={playerName}
          studentId={activeChild?.id ?? null}
          currentXP={localXP}
          onEnterBuilding={enterBuilding}
          onEnterKitchen={() => setScreen('kitchen')}
          onXpEarned={addXP}
          onCoinsEarned={addCoins}
          onLifeMapEntry={handleLifeMapEntry}
        />
```
(Note: this plan does not attempt to distinguish "storm just hit, first time seeing this" from "still calm/no recent storm" — a `phase === 'hit'` banner only shows on the exact hit day per the brain's phase computation, which is a narrow one-day window; that's an acceptable v1 simplification, not a bug to fix here.)

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit` from the repo root.
Expected: 0 errors project-wide.

- [ ] **Step 9: Commit**

```bash
git add src/pages/GameShell.tsx
git commit -m "feat: add storm banner, storm mission wiring, and prep recording to GameShell"
```

---

### Task 5: Manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: If a live brain with the sibling storm plan deployed is reachable** (`BRAIN_URL` set — likely still configured from prior verification this session), start the dev server and, using the brain's temporary `STORM_ANCHOR` override technique (per the brain plan's Task 3) to force a warning phase, manually click through: enter a building as a town member during the forced warning window, confirm the storm-themed mission (not a brain-generated or old fallback mission) appears, complete it, confirm the banner shows the countdown. If no live backend is reachable in this environment, note that as a disclosed gap.

- [ ] **Step 3: No commit for this task** (verification only)
