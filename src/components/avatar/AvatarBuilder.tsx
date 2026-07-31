import { useState } from 'react'
import { AvatarData, AvatarCharacter, DEFAULT_AVATAR } from '../../types/game'
import AvatarRenderer from './AvatarRenderer'

interface Props {
  initialAvatar?: AvatarData
  playerName: string
  onSave: (avatar: AvatarData) => void
}

const ACCENT_COLORS = [
  { label: 'Amber',   value: '#f59e0b' },
  { label: 'Sky',     value: '#0ea5e9' },
  { label: 'Rose',    value: '#f43f5e' },
  { label: 'Violet',  value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Orange',  value: '#f97316' },
  { label: 'Pink',    value: '#ec4899' },
  { label: 'Teal',    value: '#14b8a6' },
]

type Category = 'young_girl' | 'young_boy' | 'older_girl' | 'older_boy'

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'young_girl',  label: 'Young Girl',  emoji: '👧' },
  { id: 'young_boy',   label: 'Young Boy',   emoji: '👦' },
  { id: 'older_girl',  label: 'Older Girl',  emoji: '🧒' },
  { id: 'older_boy',   label: 'Older Boy',   emoji: '🧒' },
]

const CATEGORY_CHARACTERS: Record<Category, AvatarCharacter[]> = {
  young_girl: [
    'girl_young_0','girl_young_1','girl_young_2',
    'girl_young_3','girl_young_4','girl_young_5',
    'girl_young_6','girl_young_7','girl_young_8',
  ],
  young_boy: [
    'boy_young_0','boy_young_1','boy_young_2',
    'boy_young_3','boy_young_4','boy_young_5',
    'boy_young_6','boy_young_7','boy_young_8',
  ],
  older_girl: [
    'girl_middle_0','girl_middle_1','girl_middle_2',
    'girl_high_0','girl_high_1','girl_high_2',
  ],
  older_boy: [
    'boy_middle_0','boy_middle_1','boy_middle_2',
    'boy_high_0','boy_high_1','boy_high_2',
  ],
}

function getCategoryForCharacter(char: AvatarCharacter): Category {
  if (char.startsWith('girl_young')) return 'young_girl'
  if (char.startsWith('boy_young'))  return 'young_boy'
  if (char.startsWith('girl_'))      return 'older_girl'
  return 'older_boy'
}

export default function AvatarBuilder({ initialAvatar, playerName, onSave }: Props) {
  const [avatar, setAvatar] = useState<AvatarData>(initialAvatar ?? DEFAULT_AVATAR)
  const [category, setCategory] = useState<Category>(
    initialAvatar ? getCategoryForCharacter(initialAvatar.character) : 'young_girl'
  )

  const characters = CATEGORY_CHARACTERS[category]

  function selectCharacter(char: AvatarCharacter) {
    setAvatar(prev => ({ ...prev, character: char }))
  }

  function selectColor(color: string) {
    setAvatar(prev => ({ ...prev, displayColor: color }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur rounded-3xl p-6 space-y-5">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white font-serif">Build Your Avatar</h1>
          <p className="text-purple-200 text-sm mt-1">Hey {playerName}, pick your look!</p>
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <div className="bg-white/20 rounded-2xl p-5 flex flex-col items-center gap-3">
            <AvatarRenderer avatar={avatar} size={100} />
            <span className="text-white font-semibold text-sm">{playerName}</span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id)
                setAvatar(prev => ({ ...prev, character: CATEGORY_CHARACTERS[cat.id][0] }))
              }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                category === cat.id ? 'bg-white text-purple-900' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Character grid */}
        <div>
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Choose your pose</p>
          <div className="grid grid-cols-3 gap-2">
            {characters.map(char => (
              <button
                key={char}
                onClick={() => selectCharacter(char)}
                className={`rounded-xl overflow-hidden border-4 transition-all ${
                  avatar.character === char
                    ? 'border-amber-400 scale-105 shadow-lg shadow-amber-500/30'
                    : 'border-transparent hover:border-white/40'
                }`}
              >
                <AvatarRenderer
                  avatar={{ character: char, displayColor: avatar.displayColor }}
                  size={96}
                  className="border-0"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Accent color picker */}
        <div>
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Avatar ring color</p>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => selectColor(c.value)}
                title={c.label}
                className={`w-9 h-9 rounded-full border-4 transition-all ${
                  avatar.displayColor === c.value ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={() => onSave(avatar)}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-amber-500/30"
        >
          Enter Adeline World! →
        </button>
      </div>
    </div>
  )
}
