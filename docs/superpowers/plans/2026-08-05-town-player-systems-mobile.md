# Town & Player Systems — Adelinemobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Adelinemobile's frontend up to the new brain Town/inventory/reputation/achievement endpoints, and add a minimal Town section to the existing Settings overlay (create-or-join flow, member list, treasury).

**Architecture:** New `brainClient.ts` functions follow the exact `post`/`get`/`patch_` + null-on-failure pattern already established. `StudentUser` gains the two new profile fields the brain now returns. The Settings overlay in `GameShell.tsx` (which already shows the parent-link-code section) gains a Town section alongside it — same visual pattern, no new page.

**Tech Stack:** React 19, TypeScript, Vite — matches the rest of this codebase from prior work this session.

## Global Constraints

- This plan depends on the sibling brain plan (`dearadeline-withlove/docs/superpowers/plans/2026-08-05-town-player-systems-brain.md`) being deployed — it is built against that exact documented contract, same relationship as the auth-rewrite plan pair earlier this session.
- No test runner exists in this project — verification is `npx tsc --noEmit` + manual/HTTP-level checks, consistent with every other plan this session.
- Per the design spec (`docs/superpowers/specs/2026-08-05-town-player-systems-design.md`), v1 UI scope is deliberately minimal: a Town create/join/view section in Settings. No dedicated inventory or achievement screens yet — those are a follow-up once World Events (a separate spec) gives them something to do. Do not build more UI than this.
- All new brain calls go through the existing `/api/brain/*` proxy (the `PROXY` constant in `brainClient.ts`) — never a hardcoded brain URL.

---

## File Structure

| File | Change |
|---|---|
| `src/types/auth.ts` | `StudentUser` gains `town_id: string \| null` and `reputation: number`. |
| `src/lib/brainClient.ts` | Add `Town`, `TownMember`, `TownBuilding` types + `createTown`, `joinTown`, `getTown`, `patchTownTreasury` functions. |
| `src/pages/GameShell.tsx` | Settings overlay gains a Town section (create/join form when `town_id` is null, town info display when it's set). |

---

### Task 1: `StudentUser` type additions

**Files:**
- Modify: `src/types/auth.ts`

**Interfaces:**
- Produces: `StudentUser.town_id: string | null`, `StudentUser.reputation: number` — consumed by Task 3's `GameShell.tsx` changes.

- [ ] **Step 1: Add the two fields**

In `src/types/auth.ts`, add to the `StudentUser` interface (after `parent_display_name: string | null`):
```typescript
  town_id: string | null
  reputation: number
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` from the repo root.
Expected: 0 errors in `auth.ts` itself. (Nothing else references these fields yet, so no new errors elsewhere.)

- [ ] **Step 3: Commit**

```bash
git add src/types/auth.ts
git commit -m "feat: add town_id and reputation to StudentUser type"
```

---

### Task 2: `brainClient.ts` — Town functions

**Files:**
- Modify: `src/lib/brainClient.ts`

**Interfaces:**
- Consumes: the existing `post`, `get`, `patch_` helpers and `PROXY` constant already in this file (added earlier this session — no changes needed to them).
- Produces: `Town`, `TownMember`, `TownBuildingRef` types; `createTown(name)`, `joinTown(code)`, `getTown(townId)`, `patchTownTreasury(townId, delta)` functions — consumed by Task 3.

- [ ] **Step 1: Add the types and functions**, appended near the end of `src/lib/brainClient.ts` (after the existing student profile/xp/coins/season-pass section):

```typescript
// ── Towns ─────────────────────────────────────────────────────────────────────

export interface TownMember {
  id: string
  display_name: string
  username: string
}

export interface TownBuildingRef {
  building_key: string
}

export interface Town {
  id: string
  name: string
  join_code: string
  treasury: number
  members: TownMember[]
  buildings: TownBuildingRef[]
}

/** Create a new town. Returns null if the brain is unreachable or the caller is already in a town. */
export async function createTown(name: string): Promise<Town | null> {
  return post<Town>('/towns', { name })
}

/** Join a town by its 6-character code. Returns null on invalid code or if already in a town. */
export async function joinTown(code: string): Promise<Town | null> {
  return post<Town>('/towns/join', { code })
}

/** Fetch a town's details. Caller must be a member. */
export async function getTown(townId: string): Promise<Town | null> {
  return get<Town>(`/towns/${townId}`)
}

/** Adjust the town's shared treasury by a delta. Returns the new total, or null on failure. */
export async function patchTownTreasury(townId: string, delta: number): Promise<number | null> {
  const result = await patch_<{ treasury: number }>(`/towns/${townId}/treasury`, { delta })
  return result?.treasury ?? null
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` from the repo root.
Expected: 0 errors in `brainClient.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add src/lib/brainClient.ts
git commit -m "feat: add createTown, joinTown, getTown, patchTownTreasury to brainClient"
```

---

### Task 3: Settings overlay — Town section

**Files:**
- Modify: `src/pages/GameShell.tsx`

**Interfaces:**
- Consumes: `Town`, `createTown`, `joinTown`, `getTown` from `src/lib/brainClient.ts` (Task 2); `activeChild.town_id` (Task 1, via `useAuth().user` aliased as `activeChild` in this file).

- [ ] **Step 1: Add imports**

Find the existing `import { updateStudentProfile, patchXP, patchCoins, getSeasonPass, patchSeasonPass } from '../lib/brainClient'` line in `GameShell.tsx` and extend it:
```typescript
import { updateStudentProfile, patchXP, patchCoins, getSeasonPass, patchSeasonPass, createTown, joinTown, getTown, Town } from '../lib/brainClient'
```

- [ ] **Step 2: Add state for the town data and the create/join form**

Near the other `useState` declarations in `GameShell`, add:
```typescript
  const [town, setTown] = useState<Town | null>(null)
  const [townFormMode, setTownFormMode] = useState<'create' | 'join'>('create')
  const [townFormValue, setTownFormValue] = useState('')
  const [townFormError, setTownFormError] = useState('')
  const [townFormLoading, setTownFormLoading] = useState(false)
```

- [ ] **Step 3: Load town data when the settings overlay opens for a linked-to-a-town kid**

Add a `useEffect` near the other `useEffect`s in the file:
```typescript
  useEffect(() => {
    if (overlay === 'settings' && activeChild?.town_id && !town) {
      getTown(activeChild.town_id).then(setTown)
    }
  }, [overlay, activeChild, town])
```

- [ ] **Step 4: Add the create/join handler**

Near the other handler functions in the component:
```typescript
  async function handleTownFormSubmit() {
    setTownFormError('')
    setTownFormLoading(true)
    try {
      const result = townFormMode === 'create'
        ? await createTown(townFormValue.trim())
        : await joinTown(townFormValue.trim().toUpperCase())
      if (!result) {
        setTownFormError(townFormMode === 'create' ? 'Could not create town. Try again.' : 'Join code not found.')
      } else {
        setTown(result)
      }
    } finally {
      setTownFormLoading(false)
    }
  }
```

- [ ] **Step 5: Add the Town section to the Settings overlay JSX**

Find the Settings overlay block (`{overlay === 'settings' && activeChild && (...)}`) and add a Town section between the parent-link block and the "Sign Out" button:

```typescript
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700">Your Town</p>
              {activeChild.town_id && town ? (
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">{town.name}</p>
                  <p className="text-xs text-slate-400">{town.members.length} member{town.members.length === 1 ? '' : 's'} · {town.treasury} AdeCoins in the treasury</p>
                  <p className="text-xs text-slate-400 font-mono">Join code: {town.join_code}</p>
                </div>
              ) : activeChild.town_id ? (
                <p className="text-xs text-slate-400">Loading town...</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => { setTownFormMode('create'); setTownFormError('') }}
                      className={`px-3 py-1.5 rounded-lg font-semibold ${townFormMode === 'create' ? 'bg-amber-100 text-amber-800' : 'text-slate-400'}`}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setTownFormMode('join'); setTownFormError('') }}
                      className={`px-3 py-1.5 rounded-lg font-semibold ${townFormMode === 'join' ? 'bg-amber-100 text-amber-800' : 'text-slate-400'}`}
                    >
                      Join
                    </button>
                  </div>
                  <input
                    type="text"
                    value={townFormValue}
                    onChange={e => setTownFormValue(townFormMode === 'join' ? e.target.value.toUpperCase().slice(0, 6) : e.target.value)}
                    placeholder={townFormMode === 'create' ? 'Town name' : '6-digit code'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    maxLength={townFormMode === 'join' ? 6 : 100}
                  />
                  {townFormError && <p className="text-xs text-red-600">{townFormError}</p>}
                  <button
                    onClick={handleTownFormSubmit}
                    disabled={townFormLoading || !townFormValue.trim()}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
                  >
                    {townFormLoading ? 'Please wait...' : townFormMode === 'create' ? 'Create Town' : 'Join Town'}
                  </button>
                </div>
              )}
            </div>
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` from the repo root.
Expected: 0 errors project-wide.

- [ ] **Step 7: Commit**

```bash
git add src/pages/GameShell.tsx
git commit -m "feat: add Town create/join/view section to Settings overlay"
```

---

### Task 4: Manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`
Expected: starts without error.

- [ ] **Step 3: If a live, deployed brain with this plan's sibling backend is reachable** (`BRAIN_URL` set), manually click through: open Settings as a logged-in kid with no town → create a town → confirm the join code displays → open Settings on a second kid's session → join using that code → confirm both sessions show the same town name/treasury/member count. If no live backend is reachable in this environment, note that as a disclosed gap (same pattern as prior plans this session) rather than skipping silently.

- [ ] **Step 4: No commit for this task** (verification only)
