export type AvatarCharacter =
  | 'portrait_01' | 'portrait_02' | 'portrait_03' | 'portrait_04'
  | 'portrait_05' | 'portrait_06' | 'portrait_07' | 'portrait_08'
  | 'portrait_09' | 'portrait_10' | 'portrait_11' | 'portrait_12'
  | 'portrait_13' | 'portrait_14' | 'portrait_15' | 'portrait_16'

export interface AvatarData {
  character: AvatarCharacter
  displayColor: string  // accent color for name badge / HUD ring
}

export type RoomId =
  | 'math_mines' | 'story_forest' | 'science_lab' | 'homestead_farm' | 'truth_archive'
  | 'health_grove' | 'the_council' | 'justice_quarter' | 'the_chapel' | 'makers_market'

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
  locked?: boolean
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
  {
    id: 'health_grove',
    label: 'Health Grove',
    description: 'Natural medicine and the body God designed',
    x: 35,
    y: 18,
    color: '#16a34a',
    emoji: '🌿',
    locked: true,
  },
  {
    id: 'the_council',
    label: 'The Council',
    description: 'Civics, economics, and who really pulls the levers',
    x: 65,
    y: 18,
    color: '#7c3aed',
    emoji: '⚖️',
    locked: true,
  },
  {
    id: 'justice_quarter',
    label: 'Justice Quarter',
    description: 'Power, resistance, and the changemaker response',
    x: 10,
    y: 50,
    color: '#dc2626',
    emoji: '✊',
    locked: true,
  },
  {
    id: 'the_chapel',
    label: 'The Chapel',
    description: 'Faith, character, and reading the world through Scripture',
    x: 90,
    y: 50,
    color: '#d97706',
    emoji: '✝️',
    locked: true,
  },
  {
    id: 'makers_market',
    label: "Maker's Market",
    description: 'Making, crafting, and selling as real scholarship',
    x: 50,
    y: 88,
    color: '#c026d3',
    emoji: '🎨',
    locked: true,
  },
]

export const DEFAULT_AVATAR: AvatarData = {
  character: 'portrait_01',
  displayColor: '#f59e0b'
}

export type ActivityType = 'story_mode' | 'quiz_me' | 'build_it' | 'explore' | 'mini_game'

export type BuildingId =
  | 'adelines_kitchen'
  | 'the_library'
  | 'the_arena'
  | 'the_makers_lab'
  | 'the_creek_and_woods'
  | 'the_market'
  | 'the_chapel'

export interface FallbackMission {
  title: string
  description: string
  prompt: string
  tracks: Track[]
  xpReward: number
  coinReward: number
}

export interface TownBuilding {
  id: BuildingId
  name: string
  emoji: string
  color: string
  position: { x: number; y: number }
  activityTypes: ActivityType[]
  unlockXP: number          // 0 = always open
  description: string
  fallbackMissions: FallbackMission[]
}

export const TOWN_BUILDINGS: TownBuilding[] = [
  {
    id: 'adelines_kitchen',
    name: "Adeline's Kitchen",
    emoji: '🏡',
    color: '#d97706',
    position: { x: 50, y: 52 },
    activityTypes: [],
    unlockXP: 0,
    description: 'Come talk to Adeline. She always has an idea.',
    fallbackMissions: [],
  },
  {
    id: 'the_library',
    name: 'The Library',
    emoji: '📚',
    color: '#be185d',
    position: { x: 22, y: 35 },
    activityTypes: ['story_mode', 'explore'],
    unlockXP: 0,
    description: 'Stories, deep dives, and rabbit holes worth falling into.',
    fallbackMissions: [
      {
        title: 'Tell Your Story',
        description: 'Write about something real that happened to you this week.',
        prompt: 'Describe the event, how it made you feel, and what you learned.',
        tracks: ['ENGLISH_LITERATURE'],
        xpReward: 60,
        coinReward: 15,
      },
      {
        title: 'Follow the Money',
        description: 'Pick any historical event and ask: who profited?',
        prompt: 'Name the event, identify who benefited most, and explain with evidence.',
        tracks: ['TRUTH_HISTORY'],
        xpReward: 70,
        coinReward: 18,
      },
    ],
  },
  {
    id: 'the_arena',
    name: 'The Arena',
    emoji: '⚔️',
    color: '#dc2626',
    position: { x: 75, y: 35 },
    activityTypes: ['quiz_me', 'mini_game'],
    unlockXP: 0,
    description: 'Test your knowledge. Earn your rank.',
    fallbackMissions: [
      {
        title: 'Quick Fire Round',
        description: 'Answer 5 questions on any topic you have been studying.',
        prompt: 'Write each question and your answer. Explain your reasoning for each.',
        tracks: ['APPLIED_MATHEMATICS', 'CREATION_SCIENCE'],
        xpReward: 50,
        coinReward: 12,
      },
    ],
  },
  {
    id: 'the_makers_lab',
    name: "The Maker's Lab",
    emoji: '🔧',
    color: '#0e7490',
    position: { x: 28, y: 65 },
    activityTypes: ['build_it', 'explore'],
    unlockXP: 0,
    description: 'Build it. Break it. Figure out why. Build it better.',
    fallbackMissions: [
      {
        title: 'Kitchen Science Observation',
        description: 'Pick something in your kitchen and figure out the science behind it.',
        prompt: 'What did you observe? What question does it raise? What would you test?',
        tracks: ['CREATION_SCIENCE', 'APPLIED_MATHEMATICS'],
        xpReward: 65,
        coinReward: 16,
      },
      {
        title: 'Budget Your Build',
        description: 'Plan a real or imaginary building project with a budget.',
        prompt: 'List materials, estimate costs, and calculate the total. What would you cut if over budget?',
        tracks: ['APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY'],
        xpReward: 70,
        coinReward: 18,
      },
    ],
  },
  {
    id: 'the_creek_and_woods',
    name: 'The Creek & Woods',
    emoji: '🌿',
    color: '#16a34a',
    position: { x: 72, y: 65 },
    activityTypes: ['explore', 'build_it'],
    unlockXP: 0,
    description: 'Adeline used to bring us here for scavenger hunts and adventures.',
    fallbackMissions: [
      {
        title: 'Nature Observation Log',
        description: 'Go outside or look out a window and observe something alive.',
        prompt: 'Describe what you saw, heard, or noticed. What questions does it raise?',
        tracks: ['CREATION_SCIENCE', 'HOMESTEADING'],
        xpReward: 55,
        coinReward: 14,
      },
      {
        title: 'Animal Care Log',
        description: 'Document caring for an animal (or describe how you would).',
        prompt: 'What does this animal need daily? What have you observed about its behavior?',
        tracks: ['HOMESTEADING', 'HEALTH_NATUROPATHY'],
        xpReward: 60,
        coinReward: 15,
      },
    ],
  },
  {
    id: 'the_market',
    name: 'The Market',
    emoji: '🛒',
    color: '#65a30d',
    position: { x: 15, y: 52 },
    activityTypes: ['build_it', 'explore'],
    unlockXP: 300,
    description: 'Real economics. Real skills. How does money actually work?',
    fallbackMissions: [
      {
        title: 'Price Your Product',
        description: 'Pick something you make or could make and price it to sell.',
        prompt: 'List your costs, your time, and your selling price. Would you make a profit?',
        tracks: ['CREATIVE_ECONOMY', 'APPLIED_MATHEMATICS'],
        xpReward: 75,
        coinReward: 20,
      },
    ],
  },
  {
    id: 'the_chapel',
    name: 'The Chapel',
    emoji: '✝️',
    color: '#7c3aed',
    position: { x: 85, y: 52 },
    activityTypes: ['story_mode', 'explore'],
    unlockXP: 500,
    description: 'Quiet. Reflective. A place to think about what actually matters.',
    fallbackMissions: [
      {
        title: 'Scripture & Life',
        description: 'Pick a verse that has meant something to you recently.',
        prompt: 'Write the verse, explain what it means to you, and how it connects to your life right now.',
        tracks: ['DISCIPLESHIP', 'ENGLISH_LITERATURE'],
        xpReward: 60,
        coinReward: 15,
      },
    ],
  },
]

// World Events: The Storm. Hand-authored storm-prep content per building,
// swapped in for that building's normal missions during the storm's warning
// window. See docs/superpowers/specs/2026-08-06-world-events-storm-design.md.
export const STORM_MISSIONS: Record<BuildingId, FallbackMission[]> = {
  adelines_kitchen: [
    {
      title: 'Stock the Pantry',
      description: 'A storm is coming. Help Adeline figure out what the town needs before it hits.',
      prompt: 'List what a family needs to have on hand before a storm: food, water, and one more thing. How much water does one person need per day? Show your math.',
      tracks: ['HOMESTEADING', 'APPLIED_MATHEMATICS'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_library: [
    {
      title: 'Storm Warning Notice',
      description: 'The town needs a clear, calm warning notice posted before the storm arrives.',
      prompt: 'Write a short storm warning notice for the town. What do people need to know? What should they do first, second, third?',
      tracks: ['ENGLISH_LITERATURE'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'Before Radar',
      description: 'Long before weather satellites, people still had to know a storm was coming.',
      prompt: 'How did people predict or prepare for storms before modern forecasting? Pick one method (animal behavior, cloud patterns, barometers, etc.) and explain how it worked.',
      tracks: ['TRUTH_HISTORY'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_arena: [
    {
      title: 'Water for the Storm',
      description: 'Emergency planning starts with numbers.',
      prompt: 'A family of 4 needs to prepare for 3 days without clean water. If each person needs 1 gallon per day, how much water does the family need total? Show your work.',
      tracks: ['APPLIED_MATHEMATICS'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'Reading the Sky',
      description: 'Falling air pressure is one of the clearest signs a storm is coming.',
      prompt: 'Explain what barometric pressure is and why it drops before a storm. If you had a barometer, what reading would worry you?',
      tracks: ['CREATION_SCIENCE'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_makers_lab: [
    {
      title: 'Brace for Impact',
      description: "A structure that isn't braced for wind can come apart fast.",
      prompt: 'Design a simple way to brace a small shed or greenhouse against high wind. What shape resists wind best? Sketch or describe your bracing and explain why it works.',
      tracks: ['APPLIED_MATHEMATICS', 'CREATION_SCIENCE'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_creek_and_woods: [
    {
      title: 'Protect the Herd',
      description: "Animals and gardens can't take shelter on their own — that's up to you.",
      prompt: "Make a storm plan for an animal and a garden bed: where do they go, what do you check on first, and what could go wrong if you wait too long?",
      tracks: ['HOMESTEADING'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'When the Power Goes Out',
      description: 'Storms knock out power. Sometimes they cause injuries too.',
      prompt: "Name one common storm-related injury and how you'd treat it with no power and no hospital nearby. What natural remedies or basic first aid would you use?",
      tracks: ['HEALTH_NATUROPATHY'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_market: [
    {
      title: 'Price of Fear',
      description: 'Right before the storm, plywood prices at the market suddenly tripled.',
      prompt: "Is it fair for a seller to triple prices right before a storm? Explain both sides — the seller's and the buyer's — then say what you'd do if you ran the market.",
      tracks: ['CREATIVE_ECONOMY', 'GOVERNMENT_ECONOMICS'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'Storm Budget',
      description: 'Emergency supplies cost real money.',
      prompt: "You have 40 AdeCoins to spend on storm supplies. List what you'd buy and how much of your budget each item takes. What would you cut if the price went up?",
      tracks: ['APPLIED_MATHEMATICS'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
  the_chapel: [
    {
      title: 'Fear Not',
      description: 'Storms are frightening. Faith has something to say about fear.',
      prompt: 'Find or recall a Bible verse about fear or trusting God in hard times. Write it out and explain what it means to you right before something scary happens.',
      tracks: ['DISCIPLESHIP'],
      xpReward: 70,
      coinReward: 18,
    },
    {
      title: 'Write Your Storm',
      description: 'Everyone has faced something that scared them.',
      prompt: "Write about a time you were scared and how you got through it. What helped? What would you tell someone else going through something scary right now?",
      tracks: ['ENGLISH_LITERATURE'],
      xpReward: 70,
      coinReward: 18,
    },
  ],
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
