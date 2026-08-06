import { Track } from '../types/game'
import { StudentUser } from '../types/auth'

// All calls go through the server-side proxy at /api/brain/*
// which forwards to Railway with BRAIN_URL (never exposed to client)
const PROXY = '/api/brain'
const TIMEOUT_MS = 5000
const TOKEN_KEY = 'adeline_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  if (!token) return { 'Content-Type': 'application/json' }
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${PROXY}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(t)
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${PROXY}${path}`, {
      headers: authHeaders(),
      signal: controller.signal,
    })
    clearTimeout(t)
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

async function patch_<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${PROXY}${path}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(t)
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrainLessonRequest {
  student_id: string
  track: Track
  topic: string
  is_homestead: boolean
  grade_level: string
  render_mode?: 'standard_lesson'
}

export interface BrainLessonBlock {
  type: string
  content: string
  source?: string
  source_label?: string
}

export interface BrainLessonResponse {
  lesson_id: string
  title: string
  blocks: BrainLessonBlock[]
}

export interface BrainTranscriptEntry {
  id: string
  student_id: string
  lesson_id: string
  track: Track
  credits: number
  created_at: string
  title?: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Generate a lesson via the brain. Returns null if brain is unreachable. */
export async function generateLesson(req: BrainLessonRequest): Promise<BrainLessonResponse | null> {
  return post<BrainLessonResponse>('/lesson/generate', req)
}

/** Record an xAPI completion statement after a mission. Fire-and-forget. */
export async function recordCompletion(
  studentId: string,
  lessonId: string,
  track: Track,
  missionTitle: string
): Promise<void> {
  await post('/learning/record', {
    student_id: studentId,
    lesson_id: lessonId,
    verb: 'completed',
    object_id: `urn:adeline:lesson:${lessonId}`,
    object_name: missionTitle,
  })
}

/** Seal a CASE transcript credit entry. Fire-and-forget. */
export async function recordTranscriptCredit(
  studentId: string,
  lessonId: string,
  track: Track,
  title: string
): Promise<void> {
  await post('/learning/transcript', {
    student_id: studentId,
    lesson_id: lessonId,
    track,
    credits: 0.1,
    title,
  })
}

/** Get the full CASE transcript for a student. */
export async function getTranscript(studentId: string): Promise<BrainTranscriptEntry[]> {
  const data = await get<{ entries: BrainTranscriptEntry[] }>(`/learning/transcript/${studentId}`)
  return data?.entries ?? []
}

// ── Student auth ──────────────────────────────────────────────────────────────

export interface StudentAuthResult {
  token: string
  student_id: string
  user: StudentUser
}

/** Register a new kid account. Returns null if the username is taken or the brain is unreachable. */
export async function registerStudentAccount(params: {
  display_name: string
  username: string
  pin: string
  grade_level?: string
}): Promise<StudentAuthResult | null> {
  return post<StudentAuthResult>('/auth/student/register', params)
}

/** Log in with username + PIN. Returns null on bad credentials or unreachable brain. */
export async function loginStudent(username: string, pin: string): Promise<StudentAuthResult | null> {
  return post<StudentAuthResult>('/auth/student/login', { username, pin })
}

/** Fetch the current student's profile. Requires a token to already be set via setToken(). */
export async function getStudentProfile(studentId: string): Promise<StudentUser | null> {
  return get<StudentUser>(`/students/${studentId}/profile`)
}

export async function updateStudentProfile(
  studentId: string,
  patch: { display_name?: string; avatar_data?: Record<string, unknown>; grade_level?: string }
): Promise<StudentUser | null> {
  return patch_<StudentUser>(`/students/${studentId}/profile`, patch)
}

export async function patchXP(studentId: string, delta: number): Promise<number | null> {
  const result = await patch_<{ xp: number }>(`/students/${studentId}/xp`, { delta })
  return result?.xp ?? null
}

export async function patchCoins(studentId: string, delta: number): Promise<number | null> {
  const result = await patch_<{ ade_coins: number }>(`/students/${studentId}/coins`, { delta })
  return result?.ade_coins ?? null
}

export async function getSeasonPass(studentId: string): Promise<number[]> {
  const result = await get<{ claimed_tiers: number[] }>(`/students/${studentId}/season-pass`)
  return result?.claimed_tiers ?? []
}

export async function patchSeasonPass(studentId: string, claimedTiers: number[]): Promise<number[]> {
  const result = await patch_<{ claimed_tiers: number[] }>(`/students/${studentId}/season-pass`, { claimed_tiers: claimedTiers })
  return result?.claimed_tiers ?? claimedTiers
}

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
 * Caller is responsible for managing lifecycle.
 *
 * Events: text {delta}, block {block_type, content, ...}, zpd {zone, ...}, done {}, error {message}
 */
export async function streamConversation(
  params: ConversationStreamParams,
  onText: (delta: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = authHeaders()
  const res = await fetch(`${PROXY}/conversation/stream`, {
    method: 'POST',
    headers: { ...headers, Accept: 'text/event-stream' },
    body: JSON.stringify(params),
    signal,
  }).catch(() => null)

  if (!res || !res.ok || !res.body) {
    onError('Could not reach Adeline right now.')
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) { onDone(); break }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      let streamDone = false
      for (const line of lines) {
        if (line.startsWith('event: ')) continue
        if (!line.startsWith('data: ')) continue
        try {
          const payload = JSON.parse(line.slice(6))
          if (payload.done !== undefined) { onDone(); streamDone = true; break }
          if (payload.delta !== undefined) onText(payload.delta)
          if (payload.message !== undefined) onError(payload.message)
        } catch { /* skip malformed */ }
      }
      if (streamDone) break
    }
  } catch (err) {
    if (signal?.aborted) {
      // intentional abort — do not call onError
    } else {
      onError('Stream interrupted.')
    }
  } finally {
    reader.releaseLock()
  }
}

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
