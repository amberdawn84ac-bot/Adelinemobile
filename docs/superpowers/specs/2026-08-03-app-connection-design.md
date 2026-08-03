# App Connection Design — Adelinemobile ↔ dearadeline-withlove
**Date:** 2026-08-03
**Status:** Approved

---

## Context

Adelinemobile and dearadeline-withlove share the same Supabase project and the same brain service, but have completely separate user models. Adelinemobile uses `aw_student_profiles` / `aw_parent_accounts` tables; the desktop uses Prisma's `User` table. No real users exist yet in Adelinemobile, making this the ideal time to unify before launch.

The goal: one student account that works standalone on mobile, and optionally connects to a parent on desktop for transcripts, homeschool records, and supervision.

---

## User Model

| User type | Signs up via | Auth method | Account lives in |
|---|---|---|---|
| Kid (solo) | Adelinemobile | Username + 4-digit PIN | Brain `User` table (role=STUDENT) |
| Kid (linked) | Adelinemobile | Same | Brain `User` table, `parentId` set |
| Parent | dearadeline-withlove desktop | Email + password | Brain `User` table (role=PARENT) |

---

## Section 1: Auth

### Adelinemobile drops Supabase auth

Adelinemobile currently authenticates via Supabase. This is replaced entirely with brain API auth. The Supabase client remains for `aw_life_map_entries` only.

### New brain endpoints (to be added to adeline-brain)

```
POST /auth/student/register
  body: { display_name, username, pin, grade_level? }
  returns: { token, student_id, user }

POST /auth/student/login
  body: { username, pin }
  returns: { token, student_id, user }

GET /students/{id}/profile
  returns: { id, display_name, username, xp, ade_coins, avatar_data,
             grade_level, link_code, parent_id?, parent_display_name? }

PATCH /students/{id}/profile
  body: { display_name?, avatar_data?, grade_level? }
  returns: updated profile

PATCH /students/{id}/xp
  body: { delta: number }
  returns: { xp: number }

PATCH /students/{id}/coins
  body: { delta: number }
  returns: { ade_coins: number }

GET /students/{id}/season-pass
  returns: { claimed_tiers: number[] }

PATCH /students/{id}/season-pass
  body: { claimed_tiers: number[] }
  returns: { claimed_tiers: number[] }
```

### Session token

- Stored in `localStorage` as `adeline_token`
- Sent as `Authorization: Bearer <token>` on every brain API call
- The existing `/api/brain/*` proxy in `server.ts` already forwards this header — no proxy changes needed

### 6-digit link code

- Generated once at registration: first 6 characters of `User.id` uppercased (e.g. `A3F9C2`)
- Stored as `link_code` on the `User` record — never changes
- Never shown during normal gameplay
- Revealed only in settings under "Link with a parent"

### PIN storage

- PIN is hashed (bcrypt) server-side before storage — never stored in plain text
- No email required for kid accounts — recovery is via parent link or device localStorage

---

## Section 2: Data Migration

### Tables removed from Adelinemobile's direct Supabase usage

| Old table | Moves to |
|---|---|
| `aw_student_profiles` | Brain `User` table + new profile endpoints |
| `aw_parent_accounts` | Brain `User` table (role=PARENT, already exists) |
| `aw_season_pass` | New brain endpoint `GET/PATCH /students/{id}/season-pass` |

### Table kept in Supabase

| Table | Why kept |
|---|---|
| `aw_life_map_entries` | Kid's personal activity journal — richer narrative than xAPI. Brain handles academic records; Supabase keeps the game journal. |

### Files changed in Adelinemobile

| File | Change |
|---|---|
| `src/context/AuthContext.tsx` | Replace Supabase auth with brain token auth. Store token in localStorage. |
| `src/lib/supabase.ts` | Keep only for `aw_life_map_entries` queries |
| `src/lib/brainClient.ts` | Add all new auth + profile endpoints |
| `src/pages/GameShell.tsx` | Replace `supabase.update({ xp })` etc. with brain PATCH calls |
| `src/pages/ParentDashboard.tsx` | Simplify — approval workflow moves to desktop |
| `src/pages/OnboardingScreen.tsx` or new `src/pages/Auth.tsx` | Username + PIN signup/login flow |

### Brain database changes (adeline-brain)

Add to `User` model in Prisma schema:
```
link_code     String   @unique  // 6-char uppercase, generated at registration
ade_coins     Int      @default(0)
avatar_data   Json?
season_pass   Json?    // { claimed_tiers: number[] }
username      String?  @unique
pin_hash      String?  // bcrypt hash, only for STUDENT role
```

Add migration to set `link_code` for any existing students.

---

## Section 3: Parent Connection

### Flow

1. Kid opens Adelinemobile settings → taps "Link with a parent" → 6-digit code revealed
2. Parent logs into dearadeline-withlove desktop → Family Settings → "Add a child" → enters code
3. Desktop calls `POST /students/claim` → brain sets `parentId` on student's `User` record
4. Both dashboards now show combined data — silently, no notification to kid

### New brain endpoint

```
POST /students/claim
  auth: parent token required
  body: { code: string }
  returns: { student_id, display_name, username, xp, grade_level }
  errors: 404 if code not found, 409 if already claimed by another parent
```

### What desktop gains after link

- Kid's XP and AdeCoins displayed alongside academic credits
- Life Map entries from `aw_life_map_entries` shown as activity feed
- Avatar displayed next to student name
- Username/avatar approval shown in desktop family settings

### What mobile gains after link

- Parent display name shown in kid's settings ("Linked to [Parent Name]")
- Season pass claims persist across devices (stored in brain, not localStorage)
- Username/avatar approval no longer shown on mobile-only dashboard (parent handles on desktop)

### Desktop changes needed (dearadeline-withlove)

| File | Change |
|---|---|
| `adeline-brain/app/api/students.py` | Add `POST /students/claim` endpoint |
| `adeline-brain/prisma/schema.prisma` | Add `link_code`, `ade_coins`, `avatar_data`, `season_pass`, `username`, `pin_hash` fields |
| `adeline-ui/src/app/(routes)/dashboard/parent/page.tsx` | Add "Add a child" → enter code flow |
| `adeline-ui/src/app/(routes)/dashboard/parent/page.tsx` | Show Life Map feed + XP/coins per child |

---

## Permission Model

| Feature | Unlinked kid | Linked kid |
|---|---|---|
| Play game, earn XP | ✅ | ✅ |
| Talk to Adeline | ✅ | ✅ |
| Transcript credits recorded | ✅ (brain records) | ✅ (visible to parent) |
| Username visible publicly | ❌ | ✅ (after parent approves) |
| Avatar visible publicly | ❌ | ✅ (after parent approves) |
| Social features (future) | ❌ | ✅ |
| Parent can see progress | ❌ | ✅ |

---

## Build Order

These are tightly coupled — build in sequence:

1. **Brain schema + endpoints** — Add fields to `User`, add auth endpoints, add `claim` endpoint
2. **Adelinemobile auth rewrite** — Replace Supabase auth with brain token auth, new PIN login UI
3. **Adelinemobile data migration** — Replace all `supabase.from('aw_student_profiles')` calls with brain API calls
4. **Desktop link flow** — "Add a child" → enter code → confirm → show combined dashboard

---

## Verification

1. Kid signs up on Adelinemobile with username + PIN → profile created in brain `User` table
2. Kid completes a mission → XP updates via `PATCH /students/{id}/xp` → visible in brain
3. Kid opens settings → "Link with a parent" → 6-digit code shown
4. Parent enters code on desktop → `POST /students/claim` → student's `parentId` set
5. Desktop parent dashboard shows kid's XP, avatar, and Life Map entries
6. Kid logs out and back in with same username + PIN → session restored from brain
7. Unlinked kid: username not publicly visible anywhere
8. Linked kid: parent approves username on desktop → visible in game
