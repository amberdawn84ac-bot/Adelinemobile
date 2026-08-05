import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { StudentUser, GuestSession } from '../types/auth'
import { getToken, setToken, clearToken, registerStudentAccount, loginStudent, getStudentProfile } from '../lib/brainClient'

interface AuthContextType {
  user: StudentUser | null
  guestSession: GuestSession | null
  isLoading: boolean
  signUp: (displayName: string, username: string, pin: string, gradeLevel: string) => Promise<void>
  signIn: (username: string, pin: string) => Promise<void>
  signOut: () => void
  startGuestSession: (displayName: string) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudentUser | null>(null)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(() => {
    try {
      const saved = localStorage.getItem('adeline_guest')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const studentId = localStorage.getItem('adeline_student_id')
    if (token && studentId) {
      getStudentProfile(studentId).then(profile => {
        if (profile) setUser(profile)
        else { clearToken(); localStorage.removeItem('adeline_student_id') }
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  async function refreshUser() {
    if (!user) return
    const profile = await getStudentProfile(user.id)
    if (profile) setUser(profile)
  }

  async function signUp(displayName: string, username: string, pin: string, gradeLevel: string) {
    const result = await registerStudentAccount({
      display_name: displayName,
      username,
      pin,
      grade_level: gradeLevel,
    })
    if (!result) throw new Error('That username may already be taken. Try another one.')
    setToken(result.token)
    localStorage.setItem('adeline_student_id', result.student_id)
    setUser(result.user)
  }

  async function signIn(username: string, pin: string) {
    const result = await loginStudent(username, pin)
    if (!result) throw new Error('Username or PIN is incorrect.')
    setToken(result.token)
    localStorage.setItem('adeline_student_id', result.student_id)
    setUser(result.user)
  }

  function signOut() {
    clearToken()
    localStorage.removeItem('adeline_student_id')
    localStorage.removeItem('adeline_guest')
    setUser(null)
    setGuestSession(null)
  }

  function startGuestSession(displayName: string) {
    const guest: GuestSession = { mode: 'guest', displayName, avatarData: {}, xp: 0, adeCoins: 0 }
    setGuestSession(guest)
    localStorage.setItem('adeline_guest', JSON.stringify(guest))
  }

  return (
    <AuthContext.Provider value={{
      user,
      guestSession,
      isLoading,
      signUp,
      signIn,
      signOut,
      startGuestSession,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
