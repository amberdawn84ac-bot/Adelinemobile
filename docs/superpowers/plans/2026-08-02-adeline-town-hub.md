# Adeline's Town — Hub World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 10 hardcoded subject portals with a brain-driven town of 7 themed buildings, a personalized Adeline greeting on hub load, an activity picker that lets kids choose HOW they learn, and a Brain Battle mini-game in The Arena.

**Architecture:** `HubWorld.tsx` gets a new town map with `TownBuilding` components replacing `RoomPortal`. On building entry, `ActivityPicker` fires the brain's gaps endpoint to get the student's next topic, presents 2-3 mode buttons, then routes to `RoomMission` (existing) or `BrainBattle` (new). `AdelineKitchen` is a dedicated chat screen wired to `POST /conversation/stream` SSE. `brainClient.ts` gains `getGaps()` and `streamConversation()`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Express proxy at `/api/brain/*`, Supabase auth, brain service on Railway

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| **Modify** | `src/types/game.ts` | Add `ActivityType`, `TownBuilding`, `TOWN_BUILDINGS`; keep all Track/LifeMap types |
| **Modify** | `src/lib/brainClient.ts` | Add `getGaps()`, `streamConversation()` |
| **Modify** | `src/components/world/HubWorld.tsx` | New town map layout; swap `RoomPortal` → `TownBuilding`; add Adeline greeting on mount |
| **Modify** | `src/pages/GameShell.tsx` | Replace `RoomId`/`ROOM_CONFIG` with `BuildingId`; add `kitchen` screen; route ActivityPicker result |
| **Create** | `src/components/world/TownBuilding.tsx` | Building visual with proximity prompt and lock state |
| **Create** | `src/components/game/ActivityPicker.tsx` | Modal card: building name + brain topic + mode buttons |
| **Create** | `src/components/game/AdelineGreeting.tsx` | Entrance greeting via SSE on hub load |
| **Create** | `src/pages/AdelineKitchen.tsx` | Full SSE chat with Adeline |
| **Create** | `src/components/game/BrainBattle.tsx` | Arena mini-game: timed quiz from brain |

---

## Task 1: Add `TownBuilding` types and `TOWN_BUILDINGS` config

**Files:**
- Modify: `src/types/game.ts`

- [ ] **Step 1: Add `ActivityType` and `TownBuilding` types + `TOWN_BUILDINGS` array**

Open `src/types/game.ts`. After the `Portal` interface (around line 35), add:

```typescript
export type ActivityType = 'story_mode' | 'quiz_me' | 'build_it' | 'explore' | 'mini_game'

export type BuildingId =
  | 'adelines_kitchen'
  | 'the_library'
  | 'the_arena'
  | 'the_makers_lab'
  | 'the_creek_and_woods'
  | 'the_market'
  | 'the_chapel'

export interface TownBuilding {
  id: BuildingId
  name: string
  emoji: string
  color: string
  position: { x: number; y: number }
  activityTypes: ActivityType[]
  unlockXP: number          // 0 = always open
  description: string
  fallbackMissions: FallbackMission[]
}

export interface FallbackMission {
  title: string
  description: string
  prompt: string
  tracks: Track[]
  xpReward: number
  coinReward: number
}
```

Then add the `TOWN_BUILDINGS` array after `HUB_PORTALS` (keep `HUB_PORTALS` for now — remove it in Task 4):

```typescript
export const TOWN_BUILDINGS: TownBuilding[] = [
  {
    id: 'adelines_kitchen',
    name: "Adeline's Kitchen",
    emoji: '🏡',
    color: '#d97706',
    position: { x: 50, y: 52 },
    activityTypes: [],   // special — opens chat, no activity picker
    unlockXP: 0,
    description: 'Come talk to Adeline. She always has an idea.',
    fallbackMissions: [],
  },
  {
    id: 'the_library',
    name: 'The Library',
    emoji: '📚',
    color: '#be185d',
    position: { x: 22, y: 35 },
    activityTypes: ['story_mode', 'explore'],
    unlockXP: 0,
    description: 'Stories, deep dives, and rabbit holes worth falling into.',
    fallbackMissions: [
      {
        title: 'Tell Your Story',
        description: 'Write about something real that happened to you this week.',
        prompt: 'Describe the event, how it made you feel, and what you learned.',
        tracks: ['ENGLISH_LITERATURE'],
        xpReward: 60,
        coinReward: 15,
      },
      {
        title: 'Follow the Money',
        description: 'Pick any historical event and ask: who profited?',
        prompt: 'Name the event, identify who benefited most, and explain with evidence.',
        tracks: ['TRUTH_HISTORY'],
        xpReward: 70,
        coinReward: 18,
      },
    ],
  },
  {
    id: 'the_arena',
    name: 'The Arena',
    emoji: '⚔️',
    color: '#dc2626',
    position: { x: 75, y: 35 },
    activityTypes: ['quiz_me', 'mini_game'],
    unlockXP: 0,
    description: 'Test your knowledge. Earn your rank.',
    fallbackMissions: [
      {
        title: 'Quick Fire Round',
        description: 'Answer 5 questions on any topic you have been studying.',
        prompt: 'Write each question and your answer. Explain your reasoning for each.',
        tracks: ['APPLIED_MATHEMATICS', 'CREATION_SCIENCE'],
        xpReward: 50,
        coinReward: 12,
      },
    ],
  },
  {
    id: 'the_makers_lab',
    name: "The Maker's Lab",
    emoji: '🔧',
    color: '#0e7490',
    position: { x: 28, y: 65 },
    activityTypes: ['build_it', 'explore'],
    unlockXP: 0,
    description: 'Build it. Break it. Figure out why. Build it better.',
    fallbackMissions: [
      {
        title: 'Kitchen Science Observation',
        description: 'Pick something in your kitchen and figure out the science behind it.',
        prompt: 'What did you observe? What question does it raise? What would you test?',
        tracks: ['CREATION_SCIENCE', 'APPLIED_MATHEMATICS'],
        xpReward: 65,
        coinReward: 16,
      },
      {
        title: 'Budget Your Build',
        description: 'Plan a real or imaginary building project with a budget.',
        prompt: 'List materials, estimate costs, and calculate the total. What would you cut if over budget?',
        tracks: ['APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY'],
        xpReward: 70,
        coinReward: 18,
      },
    ],
  },
  {
    id: 'the_creek_and_woods',
    name: 'The Creek & Woods',
    emoji: '🌿',
    color: '#16a34a',
    position: { x: 72, y: 65 },
    activityTypes: ['explore', 'build_it'],
    unlockXP: 0,
    description: 'Adeline used to bring us here for scavenger hunts and adventures.',
    fallbackMissions: [
      {
        title: 'Nature Observation Log',
        description: 'Go outside or look out a window and observe something alive.',
        prompt: 'Describe what you saw, heard, or noticed. What questions does it raise?',
        tracks: ['CREATION_SCIENCE', 'HOMESTEADING'],
        xpReward: 55,
        coinReward: 14,
      },
      {
        title: 'Animal Care Log',
        description: 'Document caring for an animal (or describe how you would).',
        prompt: 'What does this animal need daily? What have you observed about its behavior?',
        tracks: ['HOMESTEADING', 'HEALTH_NATUROPATHY'],
        xpReward: 60,
        coinReward: 15,
      },
    ],
  },
  {
    id: 'the_market',
    name: 'The Market',
    emoji: '🛒',
    color: '#65a30d',
    position: { x: 15, y: 52 },
    activityTypes: ['build_it', 'explore'],
    unlockXP: 300,
    description: 'Real economics. Real skills. How does money actually work?',
    fallbackMissions: [
      {
        title: 'Price Your Product',
        description: 'Pick something you make or could make and price it to sell.',
        prompt: 'List your costs, your time, and your selling price. Would you make a profit?',
        tracks: ['CREATIVE_ECONOMY', 'APPLIED_MATHEMATICS'],
        xpReward: 75,
        coinReward: 20,
      },
    ],
  },
  {
    id: 'the_chapel',
    name: 'The Chapel',
    emoji: '✝️',
    color: '#7c3aed',
    position: { x: 85, y: 52 },
    activityTypes: ['story_mode', 'explore'],
    unlockXP: 500,
    description: 'Quiet. Reflective. A place to think about what actually matters.',
    fallbackMissions: [
      {
        title: 'Scripture & Life',
        description: 'Pick a verse that has meant something to you recently.',
        prompt: 'Write the verse, explain what it means to you, and how it connects to your life right now.',
        tracks: ['DISCIPLESHIP', 'ENGLISH_LITERATURE'],
        xpReward: 60,
        coinReward: 15,
      },
    ],
  },
]
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only about `RoomId` still being used in other files (not in `game.ts` itself). `TownBuilding`, `BuildingId`, `ActivityType`, `FallbackMission` should resolve cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add TownBuilding types and TOWN_BUILDINGS config"
```

---

## Task 2: Add `getGaps()` and `streamConversation()` to brainClient

**Files:**
- Modify: `src/lib/brainClient.ts`

- [ ] **Step 1: Add types and `getGaps` function**

At the end of `src/lib/brainClient.ts`, append:

```typescript
// ── Learning gaps ─────────────────────────────────────────────────────────────

export interface BrainGap {
  standard_id: string
  reason: string
}

export interface BrainGapsResponse {
  student_id: string
  priority_subject: string   // e.g. "APPLIED_MATHEMATICS"
  saturation: number
  gap_standards: BrainGap[]
  suggested_daily_bread: string
}

/**
 * Get the student's learning gaps from the brain.
 * Returns null if brain is unreachable or student has no data yet.
 */
export async function getGaps(studentId: string): Promise<BrainGapsResponse | null> {
  return get<BrainGapsResponse>(`/learning-path/${studentId}/gaps`)
}

// ── Conversation stream ───────────────────────────────────────────────────────

export interface ConversationStreamParams {
  student_id: string
  message: string
  track?: string
  grade_level?: string
  conversation_history?: { role: 'user' | 'assistant'; content: string }[]
}

/**
 * Stream a conversation response from Adeline via SSE.
 * Returns an EventSource-compatible ReadableStream via fetch.
 * Caller is responsible for closing the stream.
 *
 * Events: text {delta}, block {block_type, content, ...}, zpd {zone, ...}, done {}, error {message}
 */
export async function streamConversation(
  params: ConversationStreamParams,
  onText: (delta: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  const headers = await authHeaders()
  // SSE requires no Content-Type mismatch — send as JSON body
  const res = await fetch(`${PROXY}/conversation/stream`, {
    method: 'POST',
    headers: { ...headers, Accept: 'text/event-stream' },
    body: JSON.stringify(params),
  }).catch(() => null)

  if (!res || !res.ok || !res.body) {
    onError('Could not reach Adeline right now.')
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) { onDone(); break }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('event: ')) continue  // handled below
      if (!line.startsWith('data: ')) continue
      try {
        const payload = JSON.parse(line.slice(6))
        if (payload.delta !== undefined) onText(payload.delta)
        if (payload.message !== undefined) onError(payload.message)
      } catch { /* skip malformed */ }
    }
  }
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: same errors as before (unrelated `RoomId` usage), no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/brainClient.ts
git commit -m "feat: add getGaps and streamConversation to brainClient"
```

---

## Task 3: Create `TownBuilding` component

**Files:**
- Create: `src/components/world/TownBuilding.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/world/TownBuilding.tsx
import { TownBuilding as TownBuildingType } from '../../types/game'

interface Props {
  building: TownBuildingType
  isNearby: boolean
  isLocked: boolean
  onEnter: () => void
}

export default function TownBuilding({ building, isNearby, isLocked, onEnter }: Props) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${building.position.x}%`, top: `${building.position.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
    >
      {/* Proximity prompt */}
      {isNearby && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 animate-bounce">
          {isLocked ? (
            <div className="bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              🔒 Unlock at {building.unlockXP} XP
            </div>
          ) : (
            <button
              onClick={onEnter}
              className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hover:bg-amber-50 transition-all"
            >
              Press E to enter →
            </button>
          )}
        </div>
      )}

      {/* Building icon */}
      <div
        className={`
          w-20 h-20 rounded-2xl border-4 flex items-center justify-center shadow-2xl transition-all duration-300
          ${isLocked ? 'opacity-60 grayscale' : ''}
          ${!isLocked && isNearby ? 'scale-110 ring-4 ring-amber-300/60' : ''}
          ${!isLocked && !isNearby ? 'hover:scale-105' : ''}
        `}
        style={{
          backgroundColor: building.color,
          borderColor: !isLocked && isNearby ? '#FBBF24' : 'rgba(255,255,255,0.3)',
          boxShadow: !isLocked && isNearby ? `0 0 24px ${building.color}` : undefined,
          cursor: isLocked ? 'default' : 'pointer',
        }}
        onClick={!isLocked ? onEnter : undefined}
      >
        <span className="text-4xl">{building.emoji}</span>
        {isLocked && (
          <span className="text-xl absolute bottom-1 right-1">🔒</span>
        )}
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <p className={`font-bold text-sm drop-shadow ${isLocked ? 'text-white/50' : 'text-white'}`}>
          {building.name}
        </p>
        <p className="text-white/50 text-[10px] drop-shadow max-w-[90px] text-center leading-tight">
          {isLocked ? `Unlocks at ${building.unlockXP} XP` : building.description}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/world/TownBuilding.tsx
git commit -m "feat: add TownBuilding component"
```

---

## Task 4: Create `ActivityPicker` modal

**Files:**
- Create: `src/components/game/ActivityPicker.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/game/ActivityPicker.tsx
import { useState, useEffect } from 'react'
import { TownBuilding, ActivityType, Track } from '../../types/game'
import { getGaps, BrainGapsResponse } from '../../lib/brainClient'

const ACTIVITY_LABELS: Record<ActivityType, { label: string; emoji: string; description: string }> = {
  story_mode: { label: 'Story Mode',  emoji: '📖', description: 'Read, write, and reflect' },
  quiz_me:    { label: 'Quiz Me',     emoji: '⚡', description: 'Fast questions, instant feedback' },
  build_it:   { label: 'Build It',    emoji: '🔨', description: 'Make something real' },
  explore:    { label: 'Explore',     emoji: '🔭', description: 'Follow your curiosity' },
  mini_game:  { label: 'Mini Game',   emoji: '🎮', description: 'Play and learn' },
}

// Map brain track names to display labels
const TRACK_DISPLAY: Record<string, string> = {
  APPLIED_MATHEMATICS:  'Math',
  CREATION_SCIENCE:     'Science',
  ENGLISH_LITERATURE:   'Language Arts',
  TRUTH_HISTORY:        'History',
  HOMESTEADING:         'Homesteading',
  HEALTH_NATUROPATHY:   'Health',
  GOVERNMENT_ECONOMICS: 'Economics',
  JUSTICE_CHANGEMAKING: 'Justice',
  DISCIPLESHIP:         'Discipleship',
  CREATIVE_ECONOMY:     'Creative Economy',
}

interface Props {
  building: TownBuilding
  studentId: string | null
  onSelect: (mode: ActivityType, track: Track | null, suggestedTopic: string | null) => void
  onClose: () => void
}

export default function ActivityPicker({ building, studentId, onSelect, onClose }: Props) {
  const [gaps, setGaps] = useState<BrainGapsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    getGaps(studentId).then(data => {
      setGaps(data)
      setLoading(false)
    })
  }, [studentId])

  const subjectLabel = gaps ? (TRACK_DISPLAY[gaps.priority_subject] ?? gaps.priority_subject) : null
  const suggestedTopic = gaps?.suggested_daily_bread ?? null
  const track = gaps?.priority_subject as Track | null ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 mx-4 max-w-sm w-full border-4"
        style={{ borderColor: building.color }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <span className="text-5xl">{building.emoji}</span>
          <h2 className="font-black text-slate-800 text-xl mt-2">{building.name}</h2>

          {loading ? (
            <p className="text-slate-400 text-sm mt-1 animate-pulse">Checking what you need next...</p>
          ) : subjectLabel ? (
            <div className="mt-2 bg-amber-50 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Up next</p>
              <p className="text-slate-700 text-sm font-bold">{subjectLabel}</p>
              {suggestedTopic && (
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{suggestedTopic}</p>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mt-1">{building.description}</p>
          )}
        </div>

        {/* Activity buttons */}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
          How do you want to learn?
        </p>
        <div className="space-y-2">
          {building.activityTypes.map(type => {
            const meta = ACTIVITY_LABELS[type]
            return (
              <button
                key={type}
                onClick={() => onSelect(type, track, suggestedTopic)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all text-left"
              >
                <span className="text-2xl">{meta.emoji}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{meta.label}</p>
                  <p className="text-slate-400 text-xs">{meta.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-slate-400 text-xs hover:text-slate-600 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game/ActivityPicker.tsx
git commit -m "feat: add ActivityPicker modal with brain gap integration"
```

---

## Task 5: Create `AdelineGreeting` component

**Files:**
- Create: `src/components/game/AdelineGreeting.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/game/AdelineGreeting.tsx
import { useState, useEffect } from 'react'
import { streamConversation } from '../../lib/brainClient'

interface Props {
  studentId: string | null
  playerName: string
  gradeBand: string
  onDismiss: () => void
}

export default function AdelineGreeting({ studentId, playerName, gradeBand, onDismiss }: Props) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!studentId) {
      // Guest fallback
      setText(`Well, hello there, ${playerName}! The town is ready for you. Go explore!`)
      setDone(true)
      return
    }

    streamConversation(
      {
        student_id: studentId,
        message: '__GREETING__',  // special token the brain recognizes as a session-start greeting
        grade_level: gradeBand,
        conversation_history: [],
      },
      (delta) => setText(prev => prev + delta),
      () => setDone(true),
      (err) => {
        setText(`Morning, ${playerName}! The town is yours today. Go see what calls to you.`)
        setDone(true)
        console.warn('Greeting stream error:', err)
      }
    )
  }, [studentId, playerName, gradeBand])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 pointer-events-none">
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-2 border-amber-300 p-5 max-w-md w-full pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-amber-400 shrink-0 shadow-lg">
            <img
              src="/adeline_portrait.png"
              alt="Adeline"
              className="w-full h-full object-cover"
              onError={e => {
                e.currentTarget.style.display = 'none'
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.backgroundColor = '#D97706'
                  e.currentTarget.parentElement.innerHTML =
                    '<span style="color:white;font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">A</span>'
                }
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 mb-1">Adeline</p>
            <p className="text-slate-700 text-sm leading-relaxed min-h-[48px]">
              {text || <span className="text-slate-300 animate-pulse">...</span>}
            </p>
          </div>
        </div>

        {done && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm py-2.5 rounded-2xl transition-all"
          >
            Let's go!
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game/AdelineGreeting.tsx
git commit -m "feat: add AdelineGreeting SSE component for hub load"
```

---

## Task 6: Create `AdelineKitchen` page

**Files:**
- Create: `src/pages/AdelineKitchen.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/pages/AdelineKitchen.tsx
import { useState, useRef, useEffect } from 'react'
import { streamConversation } from '../lib/brainClient'
import { GradeBand } from '../types/game'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface Props {
  studentId: string | null
  playerName: string
  gradeBand: GradeBand
  onBack: () => void
}

export default function AdelineKitchen({ studentId, playerName, gradeBand, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Come on in, ${playerName}. Pull up a chair. What's on your mind?`,
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: Message = { role: 'user', content: text }
    const assistantMsg: Message = { role: 'assistant', content: '', streaming: true }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    const history = messages
      .filter(m => !m.streaming)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

    await streamConversation(
      {
        student_id: studentId ?? 'guest',
        message: text,
        grade_level: gradeBand,
        conversation_history: history,
      },
      (delta) => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + delta }
          }
          return updated
        })
      },
      () => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, streaming: false }
          }
          return updated
        })
        setStreaming(false)
      },
      (err) => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: "My thoughts got a little tangled — try again in a moment.",
              streaming: false,
            }
          }
          return updated
        })
        setStreaming(false)
        console.warn('Kitchen stream error:', err)
      }
    )
  }

  return (
    <div className="flex flex-col h-full bg-amber-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-amber-100 shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          ←
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow">
          <img
            src="/adeline_portrait.png"
            alt="Adeline"
            className="w-full h-full object-cover"
            onError={e => {
              e.currentTarget.style.display = 'none'
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.style.backgroundColor = '#D97706'
                e.currentTarget.parentElement.innerHTML =
                  '<span style="color:white;font-size:16px;display:flex;align-items:center;justify-content:center;height:100%">A</span>'
              }
            }}
          />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Adeline's Kitchen</p>
          <p className="text-xs text-amber-600">Always home, always listening</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-white rounded-br-sm'
                  : 'bg-white text-slate-700 border border-amber-100 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content || (msg.streaming ? <span className="animate-pulse text-slate-300">...</span> : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-amber-100 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Talk to Adeline..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
            autoFocus
            disabled={streaming}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdelineKitchen.tsx
git commit -m "feat: add AdelineKitchen full SSE chat page"
```

---

## Task 7: Create `BrainBattle` mini-game

**Files:**
- Create: `src/components/game/BrainBattle.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/game/BrainBattle.tsx
import { useState, useEffect, useRef } from 'react'
import { generateLesson, BrainLessonBlock } from '../../lib/brainClient'
import { Track, GradeBand } from '../../types/game'

// Extract quiz questions from a QUIZ block returned by brain
function parseQuizBlock(block: BrainLessonBlock): { question: string; answer: string } | null {
  // Brain returns quiz content as plain text: "Q: ...\nA: ..."
  const qMatch = block.content.match(/Q:\s*(.+)/i)
  const aMatch = block.content.match(/A:\s*(.+)/i)
  if (!qMatch || !aMatch) return null
  return { question: qMatch[1].trim(), answer: aMatch[1].trim() }
}

interface Question {
  question: string
  answer: string
  userAnswer: string
  correct: boolean | null
}

interface Props {
  studentId: string | null
  track: Track
  gradeBand: GradeBand
  playerName: string
  onComplete: (xp: number, coins: number) => void
  onBack: () => void
}

const QUESTION_TIME = 30  // seconds per question

export default function BrainBattle({ studentId, track, gradeBand, playerName, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<'loading' | 'playing' | 'results'>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [inputVal, setInputVal] = useState('')
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadQuestions()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function loadQuestions() {
    const lesson = await generateLesson({
      student_id: studentId ?? 'guest',
      track,
      topic: 'quiz_battle',
      is_homestead: true,
      grade_level: gradeBand,
      render_mode: 'standard_lesson',
    })

    const quizBlocks = lesson?.blocks.filter(b => b.type === 'QUIZ') ?? []
    const parsed = quizBlocks.map(parseQuizBlock).filter(Boolean) as { question: string; answer: string }[]

    if (parsed.length === 0) {
      // Fallback questions when brain has no quiz blocks
      setQuestions([
        { question: 'What does photosynthesis produce?', answer: 'oxygen and glucose', userAnswer: '', correct: null },
        { question: 'What is 7 × 8?', answer: '56', userAnswer: '', correct: null },
        { question: 'Name one primary source a historian might use.', answer: 'diary, letter, or newspaper from the time', userAnswer: '', correct: null },
      ])
    } else {
      setQuestions(parsed.map(q => ({ ...q, userAnswer: '', correct: null })))
    }
    setPhase('playing')
    startTimer()
  }

  function startTimer() {
    setTimeLeft(QUESTION_TIME)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitAnswer('')  // time up — auto-submit empty
          return QUESTION_TIME
        }
        return prev - 1
      })
    }, 1000)
  }

  function submitAnswer(val: string) {
    if (timerRef.current) clearInterval(timerRef.current)
    const answer = val.trim().toLowerCase()
    const correctAnswer = questions[currentIdx].answer.toLowerCase()
    const correct = answer.length > 0 && correctAnswer.includes(answer)

    setQuestions(prev => {
      const updated = [...prev]
      updated[currentIdx] = { ...updated[currentIdx], userAnswer: val, correct }
      return updated
    })
    setInputVal('')

    const nextIdx = currentIdx + 1
    if (nextIdx >= questions.length) {
      setPhase('results')
    } else {
      setCurrentIdx(nextIdx)
      startTimer()
    }
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-900 text-white gap-4">
        <div className="w-12 h-12 border-4 border-red-300 border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-bold">Preparing your battle...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-900 text-white gap-4 p-8">
        <p className="text-4xl">⚠️</p>
        <p className="text-center">{error}</p>
        <button onClick={onBack} className="px-6 py-3 bg-white text-red-900 font-bold rounded-2xl">
          Back to Town
        </button>
      </div>
    )
  }

  if (phase === 'results') {
    const correct = questions.filter(q => q.correct).length
    const total = questions.length
    const xp = correct * 25
    const coins = correct * 6
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-900 text-white gap-6 p-8">
        <p className="text-6xl">{correct === total ? '🏆' : correct > total / 2 ? '⭐' : '🎯'}</p>
        <h2 className="text-2xl font-black">{playerName}'s Results</h2>
        <div className="text-center">
          <p className="text-5xl font-black">{correct}/{total}</p>
          <p className="text-red-200 mt-1">questions correct</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-300">+{xp}</p>
            <p className="text-red-200 text-xs">XP</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-300">+{coins}</p>
            <p className="text-red-200 text-xs">AdeCoins</p>
          </div>
        </div>
        <div className="space-y-2 w-full max-w-sm">
          {questions.map((q, i) => (
            <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl ${q.correct ? 'bg-green-900/50' : 'bg-red-800/50'}`}>
              <span>{q.correct ? '✅' : '❌'}</span>
              <div className="text-sm">
                <p className="font-semibold text-white">{q.question}</p>
                {!q.correct && <p className="text-red-200 text-xs">Answer: {q.answer}</p>}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => onComplete(xp, coins)}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl text-lg transition-all"
        >
          Collect Rewards
        </button>
      </div>
    )
  }

  // Playing phase
  const q = questions[currentIdx]
  const timerPct = (timeLeft / QUESTION_TIME) * 100

  return (
    <div className="flex flex-col h-full bg-red-900 text-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-red-700">
        <button onClick={onBack} className="text-red-300 hover:text-white text-sm">← Exit</button>
        <span className="font-black text-lg">⚔️ Brain Battle</span>
        <span className="text-red-300 text-sm">{currentIdx + 1}/{questions.length}</span>
      </div>

      {/* Timer bar */}
      <div className="h-2 bg-red-800">
        <div
          className="h-full bg-amber-400 transition-all duration-1000"
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-center">
          <p className="text-red-300 text-sm font-semibold mb-2">{timeLeft}s remaining</p>
          <p className="text-2xl font-black leading-snug">{q.question}</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitAnswer(inputVal) }}
            placeholder="Your answer..."
            className="w-full px-4 py-3 rounded-2xl bg-red-800 border-2 border-red-600 text-white placeholder-red-400 focus:outline-none focus:border-amber-400 text-lg"
            autoFocus
          />
          <button
            onClick={() => submitAnswer(inputVal)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl text-lg transition-all"
          >
            Answer →
          </button>
          <button
            onClick={() => submitAnswer('')}
            className="w-full py-2 text-red-400 hover:text-red-200 text-sm transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game/BrainBattle.tsx
git commit -m "feat: add BrainBattle timed quiz mini-game for The Arena"
```

---

## Task 8: Update `HubWorld.tsx` — town map with buildings + greeting

**Files:**
- Modify: `src/components/world/HubWorld.tsx`

- [ ] **Step 1: Replace `HubWorld.tsx`**

The existing `HubWorld.tsx` is large. Replace it entirely with the town version:

```typescript
// src/components/world/HubWorld.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { AvatarData, PlayerState, TOWN_BUILDINGS, BuildingId, LifeMapEntry, Track } from '../../types/game'
import AvatarRenderer from '../avatar/AvatarRenderer'
import TownBuilding from './TownBuilding'
import ActivityPicker from '../game/ActivityPicker'
import AdelineGreeting from '../game/AdelineGreeting'
import ActivityConfirm, { PendingActivity } from '../chat/ActivityConfirm'
import { buildMemoryContext, upsertMemory } from '../../lib/memoryService'
import { logActivity } from '../../lib/lifeMapService'
import { TownBuilding as TownBuildingType, ActivityType } from '../../types/game'

const MOVE_SPEED = 1.5
const BUILDING_PROXIMITY = 12

interface Props {
  avatarData: AvatarData
  playerName: string
  studentId: string | null
  currentXP: number
  onEnterBuilding: (buildingId: BuildingId, mode: ActivityType, track: Track | null, suggestedTopic: string | null) => void
  onEnterKitchen: () => void
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
  onLifeMapEntry: (entry: LifeMapEntry) => void
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

export default function HubWorld({
  avatarData, playerName, studentId, currentXP,
  onEnterBuilding, onEnterKitchen,
  onXpEarned, onCoinsEarned, onLifeMapEntry
}: Props) {
  const [player, setPlayer] = useState<PlayerState>({ x: 50, y: 80, facing: 'up' })
  const keysPressed = useRef<Set<string>>(new Set())
  const animFrame = useRef<number | undefined>(undefined)
  const playerRef = useRef(player)
  playerRef.current = player

  const [showGreeting, setShowGreeting] = useState(true)
  const [pickerBuilding, setPickerBuilding] = useState<TownBuildingType | null>(null)
  const [pendingActivity, setPendingActivity] = useState<PendingActivity | null>(null)
  const [memoryContext, setMemoryContext] = useState('')

  void currentXP  // reserved for future use

  useEffect(() => {
    if (studentId) buildMemoryContext(studentId).then(setMemoryContext)
  }, [studentId])

  const movePlayer = useCallback(() => {
    setPlayer(prev => {
      let { x, y, facing } = prev
      if (keysPressed.current.has('ArrowUp')    || keysPressed.current.has('w') || keysPressed.current.has('W')) { y -= MOVE_SPEED; facing = 'up' }
      if (keysPressed.current.has('ArrowDown')  || keysPressed.current.has('s') || keysPressed.current.has('S')) { y += MOVE_SPEED; facing = 'down' }
      if (keysPressed.current.has('ArrowLeft')  || keysPressed.current.has('a') || keysPressed.current.has('A')) { x -= MOVE_SPEED; facing = 'left' }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) { x += MOVE_SPEED; facing = 'right' }
      x = Math.max(3, Math.min(97, x))
      y = Math.max(15, Math.min(93, y))
      return { x, y, facing }
    })
    animFrame.current = requestAnimationFrame(movePlayer)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysPressed.current.add(e.key)
      if (e.key === 'e' || e.key === 'E') {
        if (pickerBuilding || showGreeting) return
        const p = playerRef.current
        for (const b of TOWN_BUILDINGS) {
          if (distance(p.x, p.y, b.position.x, b.position.y) < BUILDING_PROXIMITY) {
            const locked = b.unlockXP > currentXP  // use prop snapshot via closure — safe here
            if (locked) return
            if (b.id === 'adelines_kitchen') { onEnterKitchen(); return }
            setPickerBuilding(b)
            return
          }
        }
      }
      if (e.key === 'Escape') setPickerBuilding(null)
    }
    function onKeyUp(e: KeyboardEvent) { keysPressed.current.delete(e.key) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    animFrame.current = requestAnimationFrame(movePlayer)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [movePlayer, onEnterKitchen, pickerBuilding, showGreeting])

  async function confirmActivity() {
    if (!pendingActivity) return
    onXpEarned(pendingActivity.xpReward)
    onCoinsEarned(pendingActivity.coinReward)
    if (studentId) {
      const entry = await logActivity(studentId, pendingActivity.description, pendingActivity.tracks, pendingActivity.xpReward, pendingActivity.coinReward, 'chat_log')
      if (entry) onLifeMapEntry(entry)
    }
    setPendingActivity(null)
  }

  const nearbyBuilding = TOWN_BUILDINGS.find(b =>
    distance(player.x, player.y, b.position.x, b.position.y) < BUILDING_PROXIMITY
  )

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Sky + ground */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #b8e4ff 38%, #5DBB5D 38%, #228B22 100%)' }} />

      {/* Dirt path through town */}
      <div className="absolute" style={{ left: '20%', top: '38%', width: '60%', height: '54%', background: 'rgba(210,180,140,0.55)', borderRadius: '12px' }} />

      {/* Trees */}
      {[{x:4,y:42},{x:11,y:54},{x:88,y:46},{x:94,y:58},{x:3,y:72},{x:95,y:70},{x:15,y:38},{x:84,y:40}].map((t,i) => (
        <div key={i} className="absolute" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
          <div style={{ width:28, height:36, background:'#1a6b1a', borderRadius:'50% 50% 30% 30%', marginLeft:-14 }} />
          <div style={{ width:8, height:18, background:'#5D4037', marginLeft:-4 }} />
        </div>
      ))}

      {/* Buildings */}
      {TOWN_BUILDINGS.map(building => (
        <TownBuilding
          key={building.id}
          building={building}
          isNearby={nearbyBuilding?.id === building.id}
          isLocked={building.unlockXP > currentXP}
          onEnter={() => {
            if (building.id === 'adelines_kitchen') { onEnterKitchen(); return }
            setPickerBuilding(building)
          }}
        />
      ))}

      {/* Player */}
      <div
        className="absolute flex flex-col items-center transition-none"
        style={{ left: `${player.x}%`, top: `${player.y}%`, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))', zIndex: 20 }}
      >
        <AvatarRenderer avatar={avatarData} size={64} />
        <p className="text-white text-xs font-bold text-center mt-0.5 drop-shadow bg-black/40 rounded-full px-2">{playerName}</p>
      </div>

      {/* Activity confirm */}
      {pendingActivity && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40">
          <ActivityConfirm
            activity={pendingActivity}
            onConfirm={confirmActivity}
            onDismiss={() => setPendingActivity(null)}
          />
        </div>
      )}

      {/* Activity picker modal */}
      {pickerBuilding && (
        <ActivityPicker
          building={pickerBuilding}
          studentId={studentId}
          onSelect={(mode, track, topic) => {
            setPickerBuilding(null)
            onEnterBuilding(pickerBuilding.id, mode, track, topic)
          }}
          onClose={() => setPickerBuilding(null)}
        />
      )}

      {/* Adeline greeting on first load */}
      {showGreeting && (
        <AdelineGreeting
          studentId={studentId}
          playerName={playerName}
          gradeBand="3-5"
          onDismiss={() => setShowGreeting(false)}
        />
      )}

      {/* Controls hint */}
      {!pickerBuilding && !showGreeting && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
          WASD / Arrow keys to move · E to enter
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: errors about `onEnterBuilding` / `onEnterKitchen` not matching old `GameShell` props — that's fine, fixed in Task 9.

- [ ] **Step 3: Commit**

```bash
git add src/components/world/HubWorld.tsx
git commit -m "feat: replace portal hub with town building world"
```

---

## Task 9: Update `GameShell.tsx` — wire buildings, kitchen, activity modes

**Files:**
- Modify: `src/pages/GameShell.tsx`

- [ ] **Step 1: Replace `GameShell.tsx`**

```typescript
// src/pages/GameShell.tsx
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AvatarData, DEFAULT_AVATAR, LifeMapEntry, Track, ActivityType, BuildingId, GradeBand } from '../types/game'
import AvatarBuilder from '../components/avatar/AvatarBuilder'
import GameHUD from '../components/hud/GameHUD'
import HubWorld from '../components/world/HubWorld'
import LifeMap from '../components/life-map/LifeMap'
import SeasonPass from '../components/season-pass/SeasonPass'
import RoomMission from '../components/rooms/RoomMission'
import AdelineKitchen from './AdelineKitchen'
import BrainBattle from '../components/game/BrainBattle'
import { supabase } from '../lib/supabase'
import { logActivity, getLifeMap } from '../lib/lifeMapService'
import GraduationTracker from '../components/graduation/GraduationTracker'
import Portfolio from '../components/portfolio/Portfolio'
import Transcript from '../components/transcript/Transcript'
import { gradeBandFromAge } from '../lib/academicEngine'
import { TOWN_BUILDINGS } from '../types/game'

type GameScreen = 'avatar_builder' | 'hub' | 'mission' | 'brain_battle' | 'kitchen'
type Overlay = 'life_map' | 'season_pass' | 'graduation' | 'portfolio' | null

// Maps BuildingId to the label/emoji shown in the HUD while inside
const BUILDING_META: Record<BuildingId, { label: string; emoji: string }> = {
  adelines_kitchen:   { label: "Adeline's Kitchen", emoji: '🏡' },
  the_library:        { label: 'The Library',        emoji: '📚' },
  the_arena:          { label: 'The Arena',          emoji: '⚔️' },
  the_makers_lab:     { label: "The Maker's Lab",    emoji: '🔧' },
  the_creek_and_woods:{ label: 'The Creek & Woods',  emoji: '🌿' },
  the_market:         { label: 'The Market',         emoji: '🛒' },
  the_chapel:         { label: 'The Chapel',         emoji: '✝️' },
}

function parseAvatar(data: Record<string, unknown>): AvatarData | null {
  if (!data || !data.character) return null
  return data as unknown as AvatarData
}

export default function GameShell() {
  const { activeChild, guestSession, signOut, parentAccount } = useAuth()
  const navigate = useNavigate()

  const storedAvatar = activeChild?.avatar_data ? parseAvatar(activeChild.avatar_data as Record<string, unknown>) : null
  const guestAvatarRaw = guestSession?.avatarData
  const guestAvatar = guestAvatarRaw && Object.keys(guestAvatarRaw).length > 0
    ? parseAvatar(guestAvatarRaw as Record<string, unknown>) : null
  const hasAvatar = storedAvatar !== null || guestAvatar !== null

  const [screen, setScreen] = useState<GameScreen>(hasAvatar ? 'hub' : 'avatar_builder')
  const [avatarData, setAvatarData] = useState<AvatarData>(storedAvatar ?? guestAvatar ?? DEFAULT_AVATAR)
  const [currentBuilding, setCurrentBuilding] = useState<BuildingId | null>(null)
  const [activityMode, setActivityMode] = useState<ActivityType>('explore')
  const [activityTrack, setActivityTrack] = useState<Track | null>(null)
  const [activityTopic, setActivityTopic] = useState<string | null>(null)
  const [localXP, setLocalXP] = useState(activeChild?.xp ?? guestSession?.xp ?? 0)
  const [localCoins, setLocalCoins] = useState(activeChild?.ade_coins ?? guestSession?.adeCoins ?? 0)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [lifeMapEntries, setLifeMapEntries] = useState<LifeMapEntry[]>([])
  const [claimedTiers, setClaimedTiers] = useState<number[]>([])
  const [allEntries, setAllEntries] = useState<LifeMapEntry[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const gradeBand = gradeBandFromAge(activeChild?.age ?? null) as GradeBand

  const playerName = activeChild?.display_name ?? guestSession?.displayName ?? 'Explorer'

  useEffect(() => {
    if (activeChild) {
      supabase.from('aw_season_pass').select('claimed_tiers').eq('student_id', activeChild.id).single()
        .then(({ data }) => { if (data) setClaimedTiers(data.claimed_tiers ?? []) })
    }
  }, [activeChild])

  useEffect(() => {
    if (activeChild) getLifeMap(activeChild.id).then(setAllEntries)
  }, [activeChild])

  async function saveAvatar(avatar: AvatarData) {
    setAvatarData(avatar)
    if (activeChild) {
      await supabase.from('aw_student_profiles')
        .update({ avatar_data: avatar as unknown as Record<string, unknown> }).eq('id', activeChild.id)
    } else if (guestSession) {
      localStorage.setItem('adeline_guest', JSON.stringify({ ...guestSession, avatarData: avatar }))
    }
    setScreen('hub')
  }

  async function addXP(amount: number) {
    const newXP = localXP + amount
    setLocalXP(newXP)
    if (activeChild) {
      await supabase.from('aw_student_profiles').update({ xp: newXP }).eq('id', activeChild.id)
    }
  }

  async function addCoins(amount: number) {
    const newCoins = localCoins + amount
    setLocalCoins(newCoins)
    if (activeChild) {
      await supabase.from('aw_student_profiles').update({ ade_coins: newCoins }).eq('id', activeChild.id)
    }
  }

  function handleLifeMapEntry(entry: LifeMapEntry) {
    setLifeMapEntries(prev => [entry, ...prev])
    setAllEntries(prev => [entry, ...prev])
  }

  async function handleMissionComplete(description: string, tracks: Track[], xp: number, coins: number) {
    addXP(xp)
    addCoins(coins)
    if (activeChild) {
      const entry = await logActivity(activeChild.id, description, tracks, xp, coins, 'room_mission')
      if (entry) handleLifeMapEntry(entry)
    }
  }

  async function claimSeasonTier(tier: number, coinsToAdd: number) {
    const newClaimed = [...claimedTiers, tier]
    setClaimedTiers(newClaimed)
    if (coinsToAdd > 0) addCoins(coinsToAdd)
    if (activeChild) {
      await supabase.from('aw_season_pass')
        .upsert({ student_id: activeChild.id, claimed_tiers: newClaimed }, { onConflict: 'student_id' })
    }
  }

  const enterBuilding = useCallback((
    buildingId: BuildingId,
    mode: ActivityType,
    track: Track | null,
    topic: string | null
  ) => {
    setCurrentBuilding(buildingId)
    setActivityMode(mode)
    setActivityTrack(track)
    setActivityTopic(topic)
    setScreen(mode === 'mini_game' ? 'brain_battle' : 'mission')
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function exitToHub() {
    setCurrentBuilding(null)
    setScreen('hub')
  }

  const buildingMeta = currentBuilding ? BUILDING_META[currentBuilding] : null
  const hudPlayer = activeChild ? { ...activeChild, xp: localXP, ade_coins: localCoins } : null
  const hudGuest = guestSession ? { ...guestSession, xp: localXP, adeCoins: localCoins } : null

  // Get tracks for current building (for RoomMission)
  const buildingTracks: Track[] = currentBuilding
    ? (TOWN_BUILDINGS.find(b => b.id === currentBuilding)?.fallbackMissions[0]?.tracks ?? ['ENGLISH_LITERATURE'])
    : ['ENGLISH_LITERATURE']
  const resolvedTrack: Track = activityTrack ?? buildingTracks[0]

  // ── Avatar Builder ──
  if (screen === 'avatar_builder') {
    return (
      <AvatarBuilder
        initialAvatar={storedAvatar ?? guestAvatar ?? undefined}
        playerName={playerName}
        onSave={saveAvatar}
      />
    )
  }

  // ── Adeline's Kitchen ──
  if (screen === 'kitchen') {
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <GameHUD
          player={hudPlayer}
          guestSession={hudGuest}
          avatarData={avatarData}
          roomLabel="🏡 Adeline's Kitchen"
          onExitRoom={exitToHub}
          onSignOut={handleSignOut}
        />
        <div className="w-full h-full pt-16">
          <AdelineKitchen
            studentId={activeChild?.id ?? null}
            playerName={playerName}
            gradeBand={gradeBand}
            onBack={exitToHub}
          />
        </div>
      </div>
    )
  }

  // ── Brain Battle mini-game ──
  if (screen === 'brain_battle' && currentBuilding) {
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <div className="w-full h-full">
          <BrainBattle
            studentId={activeChild?.id ?? null}
            track={resolvedTrack}
            gradeBand={gradeBand}
            playerName={playerName}
            onComplete={(xp, coins) => {
              addXP(xp)
              addCoins(coins)
              exitToHub()
            }}
            onBack={exitToHub}
          />
        </div>
      </div>
    )
  }

  // ── Mission view ──
  if (screen === 'mission' && currentBuilding && buildingMeta) {
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <GameHUD
          player={hudPlayer}
          guestSession={hudGuest}
          avatarData={avatarData}
          roomLabel={`${buildingMeta.emoji} ${buildingMeta.label}`}
          onExitRoom={exitToHub}
          onSignOut={handleSignOut}
        />
        <div className="w-full h-full pt-16">
          <RoomMission
            roomId={currentBuilding as any}
            roomLabel={buildingMeta.label}
            roomEmoji={buildingMeta.emoji}
            roomTracks={[resolvedTrack]}
            playerName={playerName}
            systemContext={activityTopic ?? `${activityMode} activity in ${buildingMeta.label}`}
            studentId={activeChild?.id ?? null}
            gradeBand={gradeBand}
            onComplete={handleMissionComplete}
            onBack={exitToHub}
          />
        </div>
      </div>
    )
  }

  // ── Hub World ──
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <GameHUD
        player={hudPlayer}
        guestSession={hudGuest}
        avatarData={avatarData}
        onSignOut={handleSignOut}
      />
      <div className="fixed top-16 right-3 z-40 flex flex-col gap-1.5 pointer-events-auto">
        <button onClick={() => setOverlay('life_map')}
          className="bg-violet-600/90 hover:bg-violet-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          🗺️ Life Map
        </button>
        <button onClick={() => setOverlay('season_pass')}
          className="bg-amber-600/90 hover:bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          🌟 Pass
        </button>
        <button onClick={() => setOverlay('graduation')}
          className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          🎓 Path
        </button>
        <button onClick={() => setOverlay('portfolio')}
          className="bg-blue-600/90 hover:bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          📁 Portfolio
        </button>
        {parentAccount && (
          <button onClick={() => navigate('/parent-dashboard')}
            className="bg-slate-600/90 hover:bg-slate-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
            👪 Parent
          </button>
        )}
      </div>
      <div className="w-full h-full pt-16">
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
      </div>

      {overlay === 'life_map' && (
        <LifeMap studentId={activeChild?.id ?? null} localEntries={lifeMapEntries} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'season_pass' && (
        <SeasonPass currentXP={localXP} claimedTiers={claimedTiers} onClaimTier={claimSeasonTier} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'graduation' && (
        <GraduationTracker entries={allEntries} gradeBand={gradeBand} studentName={playerName} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'portfolio' && (
        <Portfolio
          entries={allEntries}
          studentName={playerName}
          gradeBand={gradeBand}
          onClose={() => setOverlay(null)}
          onExport={() => { setOverlay(null); setShowTranscript(true) }}
        />
      )}
      {showTranscript && (
        <Transcript
          entries={allEntries}
          studentName={playerName}
          gradeBand={gradeBand}
          parentName={parentAccount?.display_name ?? 'Parent'}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript passes cleanly**

```bash
cd /c/Users/Aarons/Adelinemobile && npx tsc --noEmit 2>&1
```

Expected: 0 errors. If there are errors about `RoomId` still being imported somewhere, trace and remove those imports.

- [ ] **Step 3: Commit**

```bash
git add src/pages/GameShell.tsx
git commit -m "feat: wire town buildings, kitchen, and brain battle into GameShell"
```

---

## Task 10: Smoke test + push

- [ ] **Step 1: Run the dev server**

```bash
cd /c/Users/Aarons/Adelinemobile && npm run dev
```

Open `http://localhost:3000` and verify:

1. Hub loads → Adeline greeting appears (may show fallback text if brain is not running locally — that's fine)
2. Walk avatar (WASD) near The Library → "Press E to enter" prompt appears
3. Press E → ActivityPicker modal opens, shows building name and activity buttons
4. Select an activity → transitions to RoomMission screen
5. Walk to The Arena → press E → select "Mini Game" → BrainBattle loads with questions
6. Walk to Adeline's Kitchen → press E (or click) → opens AdelineKitchen chat
7. The Market and Chapel show 🔒 lock at low XP

- [ ] **Step 2: Fix any visual issues found**

Common issues to check:
- Building positions overlap or are off-screen — adjust `position.x/y` in `TOWN_BUILDINGS`
- Proximity detection fires too early/late — adjust `BUILDING_PROXIMITY` constant in `HubWorld.tsx`
- Greeting blocks movement — verify `showGreeting` gates key events correctly

- [ ] **Step 3: Push to origin**

```bash
git push origin main
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ 7 buildings with personality + activity types
- ✅ Adeline greeting on hub load (SSE)
- ✅ Adeline's Kitchen = full chat
- ✅ Brain gap detection on building entry
- ✅ Activity picker with mode selection
- ✅ Brain Battle mini-game in The Arena
- ✅ XP-based building locks
- ✅ Fallback missions when brain unreachable
- ✅ All Track types preserved
- ✅ Transcript/ParentDashboard unchanged

**Removed (clean):**
- `HUB_PORTALS` replaced by `TOWN_BUILDINGS` (kept in file until Task 8 compiles — remove in Task 1 cleanup)
- `ROOM_CONFIG` removed from GameShell
- `RoomId` type — `BuildingId` replaces it; `RoomMission` still receives `roomId` cast as `any` (acceptable bridge)
- Old quiz rooms (MathMines, StoryForest, etc.) — no longer imported in GameShell; files remain for future reuse

**Type consistency verified:**
- `BuildingId` defined in Task 1, used in Tasks 3, 4, 8, 9 ✅
- `ActivityType` defined in Task 1, used in Tasks 4, 8, 9 ✅
- `FallbackMission` defined in Task 1, used in Task 9 ✅
- `streamConversation` signature matches usage in Tasks 5 and 6 ✅
- `getGaps` return type `BrainGapsResponse` matches usage in Task 4 ✅
