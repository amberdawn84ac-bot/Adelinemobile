import { supabase } from './supabase'
import { LifeMapEntry, Track } from '../types/game'

export async function logActivity(
  studentId: string,
  description: string,
  tracks: Track[],
  xpAwarded: number,
  coinsAwarded: number,
  source: 'chat_log' | 'room_mission' | 'parent_log' = 'chat_log'
): Promise<LifeMapEntry | null> {
  const { data, error } = await supabase
    .from('aw_life_map_entries')
    .insert({
      student_id: studentId,
      description,
      tracks,
      xp_awarded: xpAwarded,
      coins_awarded: coinsAwarded,
      source
    })
    .select()
    .single()
  if (error) { console.error('lifeMapService.logActivity', error); return null }
  return data as LifeMapEntry
}

export async function getLifeMap(studentId: string): Promise<LifeMapEntry[]> {
  const { data } = await supabase
    .from('aw_life_map_entries')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  return (data ?? []) as LifeMapEntry[]
}

export async function getLifeMapByTrack(studentId: string): Promise<Partial<Record<Track, LifeMapEntry[]>>> {
  const entries = await getLifeMap(studentId)
  const byTrack: Partial<Record<Track, LifeMapEntry[]>> = {}
  for (const entry of entries) {
    for (const track of entry.tracks) {
      if (!byTrack[track]) byTrack[track] = []
      byTrack[track]!.push(entry)
    }
  }
  return byTrack
}
