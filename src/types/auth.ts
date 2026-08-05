import { GradeBand } from './game'

export interface StudentUser {
  id: string
  display_name: string
  username: string
  xp: number
  ade_coins: number
  avatar_data: Record<string, unknown>
  grade_level: GradeBand
  link_code: string
  parent_id: string | null
  parent_display_name: string | null
}

export interface GuestSession {
  mode: 'guest'
  displayName: string
  avatarData: Record<string, unknown>
  xp: number
  adeCoins: number
}
