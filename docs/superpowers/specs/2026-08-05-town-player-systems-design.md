# Town & Player Systems — Design Spec
**Date:** 2026-08-05
**Status:** Approved

---

## Context

This is the foundation slice of a much larger vision (World Events, Quests, Bosses, physical+digital crafting, graduation-as-campaign) — see conversation notes. It intentionally covers only what everything else needs to stand on: a shared **Town** that kids can belong to, and a **dual-layer resource model** (town-pooled + individual) for money, property, and inventory. World Events, Quests, and the cross-town "Connected World" layer are separate specs, built on top of this one, not part of it.

Today, Adelinemobile has no grouping concept beyond parent↔kid linking (built earlier this session): each `User` (role=STUDENT) has `xp`, `adeCoins`, `avatarData`, `gradeLevel`, and is optionally linked to one parent. `TOWN_BUILDINGS` is a single hardcoded global constant — every kid sees the same 7 buildings, with no per-kid or per-group state. Skill-tree-equivalent data already exists via the 10 `Track`s and the `LifeMapEntry`/credit system (`aw_life_map_entries` in Supabase, tagged by track, rolled up into `CreditSummary`/`PortfolioEntry` against `GRADE_EXPECTATIONS`).

## Decisions (from brainstorm)

- **Town membership is independent of parent-child linking** — a kid joins a Town via its own join code (same pattern as the existing parent link-code), not derived from who their parent is. Supports siblings, co-op/class cohorts, or solo play (no town).
- **A kid belongs to zero or one Town** at a time (not many-to-many) — simplifies the data model to a nullable FK on `User`, no join table needed.
- **Dual-layer resources, per the user's explicit call ("just like in real life")**: money, property, and inventory/tools/materials each have BOTH a Town-shared pool AND individual per-kid holdings of the same type — not a single pooled-or-individual choice.
- **Skill trees, reputation, and achievements are individual only** — no town-level version. If a future World Event needs to know "does this town have enough Engineering skill," that's computed by aggregating members' individual skills at event-evaluation time, not a stored town-level stat.
- **Where it lives:** `adeline-brain` (not Adelinemobile's Supabase) — it already owns the `User`/auth model this depends on (built earlier this session: username+PIN auth, bearer tokens, `verify_student_access` ownership checks). New data lives in the same Postgres database as `User`, via the same raw-asyncpg pattern the existing student endpoints use.
- **Item catalog (tools/materials/clothing/collectibles/etc.) is ONE generic `Item` model** with a free-text `type` tag, not ten parallel systems. Businesses, pets, vehicles, blueprints, and recipes — called out in the original vision — become `Item` types later, once this foundation exists; they are not separate systems in this spec.

## Explicitly Out of Scope for v1

- Individual property/land beyond the Town's own buildings (a kid owning their own plot/business) — v1.1.
- Leaving/removing a Town member, town deletion, or transferring ownership.
- Any spending/permission rules on the shared treasury or supply (v1: any member can add to or draw from the pool; who's *allowed* to spend how much is a gameplay-design question for the World Events spec, not this one).
- An API for creating new `Item`/`Achievement` catalog entries — the catalog is seeded directly in the database by the dev team for now, not exposed as an endpoint.
- World Events themselves (the storm, evaluation, rebuild) — this spec only builds the resource model events will later act on.
- The cross-town "Connected World" opt-in layer.

## Data Model

New tables in the `adeline-brain` Postgres database (raw SQL migration, same style as `prisma/migrations/20260804_add_student_mobile_fields`):

```sql
-- One row per Town.
CREATE TABLE "Town" (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT NOT NULL,
    "joinCode"  TEXT NOT NULL UNIQUE,     -- 6-char uppercase, same generation pattern as User.linkCode
    treasury    INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A kid belongs to zero or one Town.
ALTER TABLE "User" ADD COLUMN "townId" TEXT REFERENCES "Town"(id);

-- Per-town instance of each of the existing 7 hardcoded buildings, so town-specific
-- state (needed by future World Events — "did this building survive the storm") has
-- somewhere to live. buildingKey matches the existing client-side BuildingId union
-- (adelines_kitchen, the_library, the_arena, the_makers_lab, the_creek_and_woods,
-- the_market, the_chapel) — not re-validated server-side in v1, client owns that enum.
CREATE TABLE "TownBuilding" (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "townId"      TEXT NOT NULL REFERENCES "Town"(id) ON DELETE CASCADE,
    "buildingKey" TEXT NOT NULL,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("townId", "buildingKey")
);

-- Item catalog — one generic model for tools/materials/clothing/collectibles/etc.
-- `type` is free text (not an enum) so new categories don't need a migration.
CREATE TABLE "Item" (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,
    description TEXT,
    "iconUrl"   TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Town-shared item pool.
CREATE TABLE "TownSupply" (
    id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "townId"  TEXT NOT NULL REFERENCES "Town"(id) ON DELETE CASCADE,
    "itemId"  TEXT NOT NULL REFERENCES "Item"(id),
    quantity  INTEGER NOT NULL DEFAULT 0,
    UNIQUE ("townId", "itemId")
);

-- Individual per-kid item holdings.
CREATE TABLE "PlayerInventory" (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "itemId"    TEXT NOT NULL REFERENCES "Item"(id),
    quantity    INTEGER NOT NULL DEFAULT 0,
    UNIQUE ("studentId", "itemId")
);

-- Individual reputation stat (money already exists as User.adeCoins — this is its
-- non-fungible-standing counterpart).
ALTER TABLE "User" ADD COLUMN reputation INTEGER NOT NULL DEFAULT 0;

-- Achievement catalog + per-kid earned achievements.
CREATE TABLE "Achievement" (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key         TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    description TEXT,
    icon        TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "PlayerAchievement" (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId"     TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "achievementId" TEXT NOT NULL REFERENCES "Achievement"(id),
    "earnedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("studentId", "achievementId")
);
```

`prisma/schema.prisma` gets the equivalent models added, to stay truthful to the live schema (same convention as the auth-rewrite migration).

## API (adeline-brain, FastAPI)

All routes require the existing bearer-token auth (`get_current_user_id` / `verify_student_access`, unchanged from the auth-rewrite work). Response shapes follow the existing `snake_case` JSON convention used by `/students/*`.

```
POST   /towns                      body: {name}              → {id, name, join_code, treasury}
POST   /towns/join                 body: {code}               → {id, name, join_code, treasury}  (sets caller's townId)
GET    /towns/{town_id}            → {id, name, join_code, treasury, members: [{id, display_name, username}], buildings: [{building_key}]}
PATCH  /towns/{town_id}/treasury   body: {delta}               → {treasury}   (member-only; auth via caller's own townId matching town_id)

GET    /towns/{town_id}/supply     → {items: [{item_id, name, type, quantity}]}
PATCH  /towns/{town_id}/supply     body: {item_id, delta}      → {item_id, quantity}

GET    /students/{id}/inventory    → {items: [{item_id, name, type, quantity}]}
PATCH  /students/{id}/inventory    body: {item_id, delta}      → {item_id, quantity}

PATCH  /students/{id}/reputation   body: {delta}               → {reputation}

GET    /students/{id}/achievements → {achievements: [{key, name, description, icon, earned_at}]}
POST   /students/{id}/achievements body: {achievement_key}     → {key, name, description, icon, earned_at}  (idempotent — granting an already-earned achievement is a no-op, not an error)

GET    /items                      → {items: [{id, name, type, description, icon_url}]}   (read-only catalog)
GET    /achievements               → {achievements: [{key, name, description, icon}]}      (read-only catalog)
```

Town membership auth for `/towns/{town_id}/treasury` and `/towns/{town_id}/supply` PATCH: caller's own `User.townId` must equal `{town_id}` — a kid can only affect their own town's shared resources, not any town by ID.

## Adelinemobile (frontend) — v1 scope

- `src/lib/brainClient.ts`: add functions for all the endpoints above (`createTown`, `joinTown`, `getTown`, `patchTownTreasury`, `getTownSupply`, `patchTownSupply`, `getInventory`, `patchInventory`, `patchReputation`, `getAchievements`, `grantAchievement`, `getItemCatalog`, `getAchievementCatalog`) — same fetch/timeout/null-on-failure pattern already established.
- `src/types/auth.ts`: `StudentUser` gains `town_id: string | null` and `reputation: number` (mirrors the brain's `User` additions).
- New `src/pages/Town.tsx` (or a settings-overlay addition, TBD at plan time): create-or-join-a-town flow, mirroring the existing "Link with a parent" settings pattern from the auth rewrite (a join-code display + a join-by-code input).
- `GameShell.tsx` settings overlay gains a Town section (name, join code if in one, treasury) alongside the existing parent-link section.
- No inventory/achievement UI beyond a minimal read-only display in v1 — the *systems* need to exist and be wired up before investing in polished UI for them; a follow-up spec covers the actual inventory/achievement screens once World Events (Spec 2) gives them something to do.

## Testing / Verification

No test runner in this project (consistent with prior work this session). Verification:
1. `python -c "import app.api.towns"` / relevant module import checks, `npx tsc --noEmit` on the frontend.
2. Live smoke test against a real database: create a town, join it from a second account, verify treasury/supply/inventory/reputation/achievement endpoints round-trip correctly, verify a kid can't PATCH a town they're not a member of (403/404).
3. Manual UI check once a browser-capable session is available (same disclosed gap as prior specs this session).
