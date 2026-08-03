import { supabase } from './supabase'
import { Track } from '../types/game'

// All calls go through the server-side proxy at /api/brain/*
// which forwards to Railway with BRAIN_URL (never exposed to client)
const PROXY = '/api/brain'
const TIMEOUT_MS = 5000

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return { 'Content-Type': 'application/json' }
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  } catch {
    return { 'Content-Type': 'application/json' }
  }
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${PROXY}${path}`, {
      method: 'POST',
      headers: await authHeaders(),
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
      headers: await authHeaders(),
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

/** Register a student in the brain on first create. */
export async function registerStudent(params: {
  student_id: string
  name: string
  grade_level: string
  is_homestead: boolean
  tracks: Track[]
}): Promise<boolean> {
  const result = await post('/students/register', params)
  return result !== null
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
  const headers = await authHeaders()
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
