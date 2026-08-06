# World Events — The Storm (v1) — Design Spec
**Date:** 2026-08-06
**Status:** Approved

---

## Context

This is the first World Event, built on top of the Town & Player Systems foundation shipped earlier this session (Town entity with shared treasury, `TownBuilding` rows pre-seeded for all 7 buildings, `PlayerInventory`/reputation/achievements). Per the brainstorm, this spec builds **one concrete event — The Storm — hardcoded**, not a generic reusable "world event framework." A second event, if and when it's built, tells us what's actually worth generalizing; guessing at the abstraction now would guess wrong.

Per explicit user correction during brainstorming: the per-building storm-themed content is **not** deferrable — a countdown with no real content behind it is pointless. This spec includes real, hand-authored mission content for all 7 buildings.

## Decisions (from brainstorm)

- **Schedule:** fixed real-world cycle (every 21 days), computed from one anchor date — no scheduled job, no DB row for "when is the next storm." Every Town is on the same global calendar, matching the earlier Town-system decision that events happen world-wide while resources stay per-town.
- **Warning window:** 4 real days before each cycle's storm date.
- **Content delivery:** reuse the existing mission system's shape (`FallbackMission`: title/description/prompt/tracks/xpReward/coinReward) — a new hand-authored `STORM_MISSIONS` set per building, swapped in for that building's normal missions only during the warning window.
- **Prep tracking:** simple town-wide threshold — completing a storm mission (any building, any member) increments the town's prep counter. No per-building weighting in v1.
- **Consequence:** treasury-only. Below the prep threshold when the storm hits → `Town.treasury` takes a coin penalty, narratively framed as repair costs. No new building-damage state.
- **UI:** a banner in `HubWorld` during the warning window (e.g. "⛈️ Storm in 3 days"), pulled from a new status endpoint. After the storm hits, the banner shows a rebuild summary.
- **Where it lives:** `adeline-brain`, alongside the existing Town system — same Postgres tables, same auth (`verify_student_access`/town-membership pattern already built).

## Storm Mission Content (all 7 buildings)

Same shape as the existing `FallbackMission` interface (`src/types/game.ts`). These become a new `STORM_MISSIONS: Record<BuildingId, FallbackMission[]>` constant.

```typescript
adelines_kitchen: [
  {
    title: 'Stock the Pantry',
    description: 'A storm is coming. Help Adeline figure out what the town needs before it hits.',
    prompt: 'List what a family needs to have on hand before a storm: food, water, and one more thing. How much water does one person need per day? Show your math.',
    tracks: ['HOMESTEADING', 'APPLIED_MATHEMATICS'],
    xpReward: 70, coinReward: 18,
  },
],
the_library: [
  {
    title: 'Storm Warning Notice',
    description: 'The town needs a clear, calm warning notice posted before the storm arrives.',
    prompt: 'Write a short storm warning notice for the town. What do people need to know? What should they do first, second, third?',
    tracks: ['ENGLISH_LITERATURE'],
    xpReward: 70, coinReward: 18,
  },
  {
    title: 'Before Radar',
    description: 'Long before weather satellites, people still had to know a storm was coming.',
    prompt: 'How did people predict or prepare for storms before modern forecasting? Pick one method (animal behavior, cloud patterns, barometers, etc.) and explain how it worked.',
    tracks: ['TRUTH_HISTORY'],
    xpReward: 70, coinReward: 18,
  },
],
the_arena: [
  {
    title: 'Water for the Storm',
    description: 'Emergency planning starts with numbers.',
    prompt: 'A family of 4 needs to prepare for 3 days without clean water. If each person needs 1 gallon per day, how much water does the family need total? Show your work.',
    tracks: ['APPLIED_MATHEMATICS'],
    xpReward: 70, coinReward: 18,
  },
  {
    title: 'Reading the Sky',
    description: 'Falling air pressure is one of the clearest signs a storm is coming.',
    prompt: 'Explain what barometric pressure is and why it drops before a storm. If you had a barometer, what reading would worry you?',
    tracks: ['CREATION_SCIENCE'],
    xpReward: 70, coinReward: 18,
  },
],
the_makers_lab: [
  {
    title: 'Brace for Impact',
    description: 'A structure that isn\'t braced for wind can come apart fast.',
    prompt: 'Design a simple way to brace a small shed or greenhouse against high wind. What shape resists wind best? Sketch or describe your bracing and explain why it works.',
    tracks: ['APPLIED_MATHEMATICS', 'CREATION_SCIENCE'],
    xpReward: 70, coinReward: 18,
  },
],
the_creek_and_woods: [
  {
    title: 'Protect the Herd',
    description: 'Animals and gardens can\'t take shelter on their own — that\'s up to you.',
    prompt: 'Make a storm plan for an animal and a garden bed: where do they go, what do you check on first, and what could go wrong if you wait too long?',
    tracks: ['HOMESTEADING'],
    xpReward: 70, coinReward: 18,
  },
  {
    title: 'When the Power Goes Out',
    description: 'Storms knock out power. Sometimes they cause injuries too.',
    prompt: 'Name one common storm-related injury and how you\'d treat it with no power and no hospital nearby. What natural remedies or basic first aid would you use?',
    tracks: ['HEALTH_NATUROPATHY'],
    xpReward: 70, coinReward: 18,
  },
],
the_market: [
  {
    title: 'Price of Fear',
    description: 'Right before the storm, plywood prices at the market suddenly tripled.',
    prompt: 'Is it fair for a seller to triple prices right before a storm? Explain both sides — the seller\'s and the buyer\'s — then say what you\'d do if you ran the market.',
    tracks: ['CREATIVE_ECONOMY', 'GOVERNMENT_ECONOMICS'],
    xpReward: 70, coinReward: 18,
  },
  {
    title: 'Storm Budget',
    description: 'Emergency supplies cost real money.',
    prompt: 'You have 40 AdeCoins to spend on storm supplies. List what you\'d buy and how much of your budget each item takes. What would you cut if the price went up?',
    tracks: ['APPLIED_MATHEMATICS'],
    xpReward: 70, coinReward: 18,
  },
],
the_chapel: [
  {
    title: 'Fear Not',
    description: 'Storms are frightening. Faith has something to say about fear.',
    prompt: 'Find or recall a Bible verse about fear or trusting God in hard times. Write it out and explain what it means to you right before something scary happens.',
    tracks: ['DISCIPLESHIP'],
    xpReward: 70, coinReward: 18,
  },
  {
    title: 'Write Your Storm',
    description: 'Everyone has faced something that scared them.',
    prompt: 'Write about a time you were scared and how you got through it. What helped? What would you tell someone else going through something scary right now?',
    tracks: ['ENGLISH_LITERATURE'],
    xpReward: 70, coinReward: 18,
  },
],
```

## Schedule & Phase Computation

No database row needed — purely computed from the current date server-side:

```
STORM_CYCLE_DAYS = 21   # a storm hits every 21 real days
STORM_WARNING_DAYS = 4  # warning window opens 4 days before each hit
STORM_ANCHOR = 2026-08-01  # first storm hit date; all future cycles derive from this
```

For any date `today`:
```
days_since_anchor = today - STORM_ANCHOR
cycle = days_since_anchor // STORM_CYCLE_DAYS
day_in_cycle = days_since_anchor % STORM_CYCLE_DAYS
days_until_hit = STORM_CYCLE_DAYS - day_in_cycle   (0 on the hit day itself)

phase =
  'hit'     if day_in_cycle == 0
  'warning' if days_until_hit <= STORM_WARNING_DAYS
  'calm'    otherwise
```

This is the same formula for every Town — the calendar is global, per the earlier Town-system decision.

## Data Model

Two new columns on `Town` (in the same migration-file style as prior work):
```sql
ALTER TABLE "Town" ADD COLUMN IF NOT EXISTS "stormPrepCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Town" ADD COLUMN IF NOT EXISTS "lastStormCycleEvaluated" INTEGER NOT NULL DEFAULT -1;
```
`lastStormCycleEvaluated` tracks which cycle number's penalty (if any) has already been applied, so evaluation is idempotent — checking `GET /towns/{id}/storm` five times in one day doesn't apply the treasury penalty five times.

## API (adeline-brain)

```
GET /towns/{town_id}/storm
  auth: town member only (same _require_town_member pattern as existing town endpoints)
  → { phase: 'calm' | 'warning' | 'hit', cycle: int, days_until_hit: int,
      prep_count: int, prep_threshold: int, treasury: int }

  Side effect: if the current cycle number is greater than `lastStormCycleEvaluated`
  (regardless of the current phase — this covers the case where nobody opens the app
  again until well after the storm has passed), evaluate the cycle that just ended:
  if prep_count < prep_threshold, subtract a treasury penalty (flat amount, e.g. 50
  AdeCoins, floored at 0 via the same GREATEST(...,0) pattern already used
  elsewhere). Either way, reset prep_count to 0 and set lastStormCycleEvaluated to
  (cycle - 1) — the cycle that just finished, not the current one, since the current
  cycle's own warning window hasn't happened yet.

POST /towns/{town_id}/storm/prep
  auth: town member only
  body: {} (no fields needed — just records "a member completed a storm mission")
  → { prep_count: int }
  Only meaningful during an active warning window; the endpoint doesn't reject calls
  outside one (idempotent — an accidental call during 'calm' just increments a
  counter that gets reset at the next evaluation anyway), keeping the client simple.
```

`prep_threshold` is a fixed constant for v1 (e.g. 10 — the exact number to be tuned at implementation/playtest time, not user-configurable).

## Adelinemobile (frontend)

- `src/types/game.ts`: new `STORM_MISSIONS: Record<BuildingId, FallbackMission[]>` constant (content above).
- `src/lib/brainClient.ts`: `getTownStorm(townId)`, `postTownStormPrep(townId)`.
- `HubWorld.tsx`: fetches storm status (when the player is in a town) and renders a banner:
  - `warning` phase: "⛈️ Storm in N days" with a subtle visual cue on each building that has storm content available.
  - `hit` phase, freshly evaluated (client can infer this by comparing the previous known `cycle` to the new one): a rebuild summary — "The storm has passed. [Your town held strong! / Repairs cost the treasury N AdeCoins.]"
  - `calm` phase (no recent storm): no banner.
- Mission entry point (`RoomMission` or wherever a building's mission list is chosen): when the player is in a town AND the storm phase is `warning`, use `STORM_MISSIONS[buildingId]` instead of the building's normal `fallbackMissions`. On completion, call `postTownStormPrep(townId)` in addition to the existing XP/coins/Life Map calls — no change to the existing completion flow otherwise.
- No brain-generated (AI) lesson path for storm missions in v1 — always the hand-authored content above. Simpler and guarantees the "no placeholder" requirement is met with real, reviewed content rather than depending on live AI generation working correctly during a scripted event.

## Explicitly Out of Scope for v1

- Per-building weighted evaluation (a future spec, if the flat threshold doesn't feel right in practice).
- Building-damage state / repair mechanic beyond the treasury number.
- Admin-configurable schedule/threshold (hardcoded constants for v1).
- Any second World Event — this spec is The Storm only.
- The "Connected World" cross-town layer.

## Testing / Verification

No test runner in this project. Verification: `tsc --noEmit` / Python import checks per file, plus a live smoke test using a date override or a short-cycle test constant (e.g. temporarily setting `STORM_CYCLE_DAYS`/`STORM_ANCHOR` to force an immediate warning window) to exercise prep-counting and evaluation without waiting 21 real days.
