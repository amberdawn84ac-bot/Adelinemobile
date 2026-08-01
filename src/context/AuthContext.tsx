import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ParentAccount, StudentProfile, GuestSession } from '../types/auth'
import { registerStudent } from '../lib/brainClient'
import { GRADE_EXPECTATIONS } from '../types/game'

interface AuthContextType {
  session: Session | null
  parentAccount: ParentAccount | null
  children: StudentProfile[]
  activeChild: StudentProfile | null
  guestSession: GuestSession | null
  isLoading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  startGuestSession: (displayName: string) => void
  setActiveChild: (child: StudentProfile) => void
  addChild: (displayName: string, username: string, age: number, gradeBand?: string) => Promise<StudentProfile>
  refreshChildren: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children: reactChildren }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [parentAccount, setParentAccount] = useState<ParentAccount | null>(null)
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([])
  const [activeChild, setActiveChildState] = useState<StudentProfile | null>(null)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(() => {
    try {
      const saved = localStorage.getItem('adeline_guest')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadParentData(session.user.id)
      else setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadParentData(session.user.id)
      else {
        setParentAccount(null)
        setStudentProfiles([])
        setActiveChildState(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadParentData(userId: string) {
    const { data: parent } = await supabase
      .from('aw_parent_accounts')
      .select('*')
      .eq('id', userId)
      .single()
    setParentAccount(parent)
    await loadChildren(userId)
    setIsLoading(false)
  }

  async function loadChildren(parentId: string) {
    const { data } = await supabase
      .from('aw_student_profiles')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at')
    setStudentProfiles(data || [])
  }

  async function refreshChildren() {
    if (!session) return
    await loadChildren(session.user.id)
  }

  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      const { error: insertError } = await supabase.from('aw_parent_accounts').insert({
        id: data.user.id,
        email,
        display_name: displayName
      })
      if (insertError) throw insertError
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setGuestSession(null)
    localStorage.removeItem('adeline_guest')
    localStorage.removeItem('adeline_active_child')
  }

  function startGuestSession(displayName: string) {
    const guest: GuestSession = { mode: 'guest', displayName, avatarData: {}, xp: 0, adeCoins: 0 }
    setGuestSession(guest)
    localStorage.setItem('adeline_guest', JSON.stringify(guest))
  }

  function setActiveChild(child: StudentProfile) {
    setActiveChildState(child)
    localStorage.setItem('adeline_active_child', child.id)
  }

  async function addChild(displayName: string, username: string, age: number, gradeBand: string = 'K-2'): Promise<StudentProfile> {
    if (!session) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('aw_student_profiles')
      .insert({ parent_id: session.user.id, display_name: displayName, username, age, grade_level: gradeBand })
      .select()
      .single()
    if (error) throw error

    // Register in brain non-blocking — failure is retried next room entry via registered_in_brain flag
    const expectation = GRADE_EXPECTATIONS.find(g => g.band === gradeBand) ?? GRADE_EXPECTATIONS[0]
    registerStudent({
      student_id: data.id,
      name: displayName,
      grade_level: gradeBand,
      is_homestead: true,
      tracks: expectation.requiredTracks,
    }).then(success => {
      if (success) {
        supabase.from('aw_student_profiles')
          .update({ registered_in_brain: true })
          .eq('id', data.id)
          .then(() => {})
      }
    })

    await refreshChildren()
    return data
  }

  return (
    <AuthContext.Provider value={{
      session,
      parentAccount,
      children: studentProfiles,
      activeChild,
      guestSession,
      isLoading,
      signUp,
      signIn,
      signOut,
      startGuestSession,
      setActiveChild,
      addChild,
      refreshChildren
    }}>
      {reactChildren}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
