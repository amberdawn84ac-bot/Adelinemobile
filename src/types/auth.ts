export interface ParentAccount {
  id: string
  email: string
  display_name: string
  created_at: string
}

export interface StudentProfile {
  id: string
  parent_id: string
  display_name: string
  username: string
  username_approved: boolean
  age: number | null
  avatar_data: Record<string, unknown>
  avatar_approved: boolean
  xp: number
  ade_coins: number
  trading_enabled: boolean
  grade_level: string
  created_at: string
}

export interface GuestSession {
  mode: 'guest'
  displayName: string
  avatarData: Record<string, unknown>
  xp: number
  adeCoins: number
}
