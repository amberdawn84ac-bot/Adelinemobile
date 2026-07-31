export interface AvatarData {
  skinTone: string
  hairStyle: 'short' | 'long' | 'curly' | 'braids' | 'ponytail'
  hairColor: string
  eyeStyle: 'round' | 'almond' | 'wide'
  outfitId: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'teal'
  accessoryId: 'none' | 'hat' | 'bow' | 'crown'
}

export type RoomId = 'math_mines' | 'story_forest' | 'science_lab' | 'homestead_farm' | 'truth_archive'

export interface PlayerState {
  x: number
  y: number
  facing: 'up' | 'down' | 'left' | 'right'
}

export interface Portal {
  id: RoomId
  label: string
  description: string
  x: number
  y: number
  color: string
  emoji: string
}

export const HUB_PORTALS: Portal[] = [
  {
    id: 'math_mines',
    label: 'Math Mines',
    description: 'Dig for answers in the mines of numbers',
    x: 25,
    y: 40,
    color: '#1e3a5f',
    emoji: '⛏️'
  },
  {
    id: 'story_forest',
    label: 'Story Forest',
    description: 'Where words grow wild and tales come alive',
    x: 72,
    y: 35,
    color: '#14532d',
    emoji: '🌲'
  },
  {
    id: 'science_lab',
    label: 'Science Lab',
    description: 'Discover how creation works',
    x: 50,
    y: 20,
    color: '#0e7490',
    emoji: '🔬'
  },
  {
    id: 'homestead_farm',
    label: 'Homestead Farm',
    description: 'Grow, raise, build, and sell',
    x: 18,
    y: 65,
    color: '#65a30d',
    emoji: '🌾'
  },
  {
    id: 'truth_archive',
    label: 'Truth Archive',
    description: 'Primary sources, real history',
    x: 82,
    y: 65,
    color: '#92400e',
    emoji: '📜'
  },
]

export const DEFAULT_AVATAR: AvatarData = {
  skinTone: '#F4C89A',
  hairStyle: 'short',
  hairColor: '#3D2314',
  eyeStyle: 'round',
  outfitId: 'blue',
  accessoryId: 'none'
}
