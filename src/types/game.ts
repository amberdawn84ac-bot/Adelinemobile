export type AvatarCharacter =
  | 'girl_young_0' | 'girl_young_1' | 'girl_young_2'
  | 'girl_young_3' | 'girl_young_4' | 'girl_young_5'
  | 'girl_young_6' | 'girl_young_7' | 'girl_young_8'
  | 'boy_young_0'  | 'boy_young_1'  | 'boy_young_2'
  | 'boy_young_3'  | 'boy_young_4'  | 'boy_young_5'
  | 'boy_young_6'  | 'boy_young_7'  | 'boy_young_8'
  | 'girl_middle_0' | 'girl_middle_1' | 'girl_middle_2'
  | 'girl_high_0'   | 'girl_high_1'   | 'girl_high_2'
  | 'boy_middle_0'  | 'boy_middle_1'  | 'boy_middle_2'
  | 'boy_high_0'    | 'boy_high_1'    | 'boy_high_2'

export interface AvatarData {
  character: AvatarCharacter
  displayColor: string  // accent color for name badge / HUD ring
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
  character: 'girl_young_4',
  displayColor: '#f59e0b'
}

export type Track =
  | 'CREATION_SCIENCE'
  | 'HEALTH_NATUROPATHY'
  | 'HOMESTEADING'
  | 'GOVERNMENT_ECONOMICS'
  | 'JUSTICE_CHANGEMAKING'
  | 'DISCIPLESHIP'
  | 'TRUTH_HISTORY'
  | 'ENGLISH_LITERATURE'
  | 'APPLIED_MATHEMATICS'
  | 'CREATIVE_ECONOMY'

export const TRACK_LABELS: Record<Track, string> = {
  CREATION_SCIENCE:     '🔬 Creation Science',
  HEALTH_NATUROPATHY:   '🌿 Health & Naturopathy',
  HOMESTEADING:         '🌾 Homesteading',
  GOVERNMENT_ECONOMICS: '⚖️ Government & Economics',
  JUSTICE_CHANGEMAKING: '✊ Justice & Changemaking',
  DISCIPLESHIP:         '✝️ Discipleship',
  TRUTH_HISTORY:        '📜 Truth & History',
  ENGLISH_LITERATURE:   '📖 English & Literature',
  APPLIED_MATHEMATICS:  '⛏️ Applied Mathematics',
  CREATIVE_ECONOMY:     '🎨 Creative Economy',
}

export const TRACK_COLORS: Record<Track, string> = {
  CREATION_SCIENCE:     '#0e7490',
  HEALTH_NATUROPATHY:   '#16a34a',
  HOMESTEADING:         '#65a30d',
  GOVERNMENT_ECONOMICS: '#7c3aed',
  JUSTICE_CHANGEMAKING: '#dc2626',
  DISCIPLESHIP:         '#d97706',
  TRUTH_HISTORY:        '#92400e',
  ENGLISH_LITERATURE:   '#be185d',
  APPLIED_MATHEMATICS:  '#1e3a5f',
  CREATIVE_ECONOMY:     '#c026d3',
}

export interface LifeMapEntry {
  id: string
  student_id: string
  description: string
  tracks: Track[]
  xp_awarded: number
  coins_awarded: number
  source: 'chat_log' | 'room_mission' | 'parent_log'
  created_at: string
}

export interface StudentMemory {
  id: string
  student_id: string
  key: string
  value: string
  updated_at: string
}

export interface SeasonTier {
  tier: number
  xpRequired: number
  reward: string
  rewardType: 'adecoin' | 'avatar_item' | 'cosmetic'
  rewardAmount?: number
}

export const SEASON_TIERS: SeasonTier[] = [
  { tier: 1,  xpRequired: 0,    reward: '50 AdeCoins',         rewardType: 'adecoin',    rewardAmount: 50 },
  { tier: 2,  xpRequired: 100,  reward: 'Red Star Hat',         rewardType: 'avatar_item' },
  { tier: 3,  xpRequired: 250,  reward: '100 AdeCoins',        rewardType: 'adecoin',    rewardAmount: 100 },
  { tier: 4,  xpRequired: 500,  reward: 'Golden Crown',         rewardType: 'avatar_item' },
  { tier: 5,  xpRequired: 800,  reward: '200 AdeCoins',        rewardType: 'adecoin',    rewardAmount: 200 },
  { tier: 6,  xpRequired: 1200, reward: 'Rainbow Bow',          rewardType: 'avatar_item' },
  { tier: 7,  xpRequired: 1700, reward: '500 AdeCoins',        rewardType: 'adecoin',    rewardAmount: 500 },
  { tier: 8,  xpRequired: 2300, reward: "Adeline's Pendant",   rewardType: 'cosmetic' },
  { tier: 9,  xpRequired: 3000, reward: '1000 AdeCoins',       rewardType: 'adecoin',    rewardAmount: 1000 },
  { tier: 10, xpRequired: 4000, reward: 'World Builder Title',  rewardType: 'cosmetic' },
]

export type GradeBand = 'K-2' | '3-5' | '6-8' | '9-12'

export interface GradeExpectation {
  band: GradeBand
  minCreditsPerYear: number
  requiredTracks: Track[]
}

export const GRADE_EXPECTATIONS: GradeExpectation[] = [
  {
    band: 'K-2',
    minCreditsPerYear: 1.0,
    requiredTracks: ['CREATION_SCIENCE', 'HEALTH_NATUROPATHY', 'HOMESTEADING', 'DISCIPLESHIP', 'ENGLISH_LITERATURE']
  },
  {
    band: '3-5',
    minCreditsPerYear: 1.5,
    requiredTracks: ['CREATION_SCIENCE', 'HEALTH_NATUROPATHY', 'HOMESTEADING', 'GOVERNMENT_ECONOMICS',
      'JUSTICE_CHANGEMAKING', 'DISCIPLESHIP', 'TRUTH_HISTORY', 'ENGLISH_LITERATURE']
  },
  {
    band: '6-8',
    minCreditsPerYear: 2.0,
    requiredTracks: ['CREATION_SCIENCE', 'HEALTH_NATUROPATHY', 'HOMESTEADING', 'GOVERNMENT_ECONOMICS',
      'JUSTICE_CHANGEMAKING', 'DISCIPLESHIP', 'TRUTH_HISTORY', 'ENGLISH_LITERATURE',
      'APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY']
  },
  {
    band: '9-12',
    minCreditsPerYear: 3.0,
    requiredTracks: ['CREATION_SCIENCE', 'HEALTH_NATUROPATHY', 'HOMESTEADING', 'GOVERNMENT_ECONOMICS',
      'JUSTICE_CHANGEMAKING', 'DISCIPLESHIP', 'TRUTH_HISTORY', 'ENGLISH_LITERATURE',
      'APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY']
  }
]

export const CREDITS_PER_ENTRY = 0.1

export const LIFE_TO_CREDIT: Record<string, Track[]> = {
  baking:      ['CREATION_SCIENCE', 'APPLIED_MATHEMATICS'],
  cooking:     ['CREATION_SCIENCE', 'APPLIED_MATHEMATICS', 'HEALTH_NATUROPATHY'],
  gardening:   ['CREATION_SCIENCE', 'HOMESTEADING'],
  building:    ['APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY'],
  woodworking: ['APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY'],
  sewing:      ['APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY', 'TRUTH_HISTORY'],
  coding:      ['APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY'],
  reading:     ['ENGLISH_LITERATURE'],
  writing:     ['ENGLISH_LITERATURE'],
  volunteering:['GOVERNMENT_ECONOMICS', 'JUSTICE_CHANGEMAKING'],
  animals:     ['CREATION_SCIENCE', 'HOMESTEADING', 'DISCIPLESHIP'],
  soap_making: ['CREATION_SCIENCE', 'CREATIVE_ECONOMY'],
  debate:      ['ENGLISH_LITERATURE', 'GOVERNMENT_ECONOMICS'],
}

export interface CreditSummary {
  track: Track
  credits: number
  entriesCount: number
  meetsYearGoal: boolean
  creditsNeeded: number
}

export interface PortfolioEntry {
  id: string
  description: string
  tracks: Track[]
  credits: number
  date: string
}
