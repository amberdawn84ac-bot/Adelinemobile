import { useState } from 'react'
import { AvatarData, AvatarCharacter, DEFAULT_AVATAR } from '../../types/game'
import AvatarRenderer, { ALL_PORTRAITS } from './AvatarRenderer'

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

export default function AvatarBuilder({ initialAvatar, playerName, onSave }: Props) {
  const [avatar, setAvatar] = useState<AvatarData>(initialAvatar ?? DEFAULT_AVATAR)

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

        {/* Character grid */}
        <div>
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Choose your look</p>
          <div className="grid grid-cols-4 gap-2">
            {ALL_PORTRAITS.map(char => (
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
