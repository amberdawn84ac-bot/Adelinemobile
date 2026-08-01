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
