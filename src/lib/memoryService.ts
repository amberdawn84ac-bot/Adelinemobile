import { supabase } from './supabase'
import { StudentMemory } from '../types/game'

export async function getMemories(studentId: string): Promise<StudentMemory[]> {
  const { data } = await supabase
    .from('aw_student_memories')
    .select('*')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })
  return data ?? []
}

export async function upsertMemory(studentId: string, key: string, value: string): Promise<void> {
  await supabase
    .from('aw_student_memories')
    .upsert(
      { student_id: studentId, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'student_id,key' }
    )
}

export async function buildMemoryContext(studentId: string): Promise<string> {
  const memories = await getMemories(studentId)
  if (memories.length === 0) return ''
  return '\n\nWhat you know about this student:\n' +
    memories.map(m => `- ${m.key}: ${m.value}`).join('\n')
}
