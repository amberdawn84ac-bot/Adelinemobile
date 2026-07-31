import { useState } from 'react'
import { AvatarData, DEFAULT_AVATAR } from '../../types/game'
import {
  SKIN_TONES, HAIR_COLORS, HAIR_STYLES,
  EYE_STYLES, OUTFITS, ACCESSORIES
} from './avatarLayers'
import AvatarRenderer from './AvatarRenderer'

interface Props {
  initialAvatar?: AvatarData
  playerName: string
  onSave: (avatar: AvatarData) => void
}

type Tab = 'skin' | 'hair' | 'eyes' | 'outfit' | 'accessory'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'skin',      label: 'Skin',   emoji: '🎨' },
  { id: 'hair',      label: 'Hair',   emoji: '💇' },
  { id: 'eyes',      label: 'Eyes',   emoji: '👀' },
  { id: 'outfit',    label: 'Outfit', emoji: '👕' },
  { id: 'accessory', label: 'Extra',  emoji: '✨' },
]

export default function AvatarBuilder({ initialAvatar, playerName, onSave }: Props) {
  const [avatar, setAvatar] = useState<AvatarData>(initialAvatar ?? DEFAULT_AVATAR)
  const [activeTab, setActiveTab] = useState<Tab>('skin')

  function set<K extends keyof AvatarData>(key: K, value: AvatarData[K]) {
    setAvatar(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur rounded-3xl p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white font-serif">Build Your Avatar</h1>
          <p className="text-purple-200 text-sm mt-1">Hey {playerName}, make it yours!</p>
        </div>

        <div className="flex justify-center">
          <div className="bg-white/20 rounded-2xl p-6 flex flex-col items-center gap-3">
            <AvatarRenderer avatar={avatar} size={120} />
            <span className="text-white font-semibold text-sm">{playerName}</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id ? 'bg-white text-purple-900' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span className="text-lg">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[140px]">
          {activeTab === 'skin' && (
            <div>
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Skin Tone</p>
              <div className="flex flex-wrap gap-3">
                {SKIN_TONES.map(tone => (
                  <button key={tone.value} onClick={() => set('skinTone', tone.value)} title={tone.label}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${avatar.skinTone === tone.value ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: tone.value }} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hair' && (
            <div className="space-y-4">
              <div>
                <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Style</p>
                <div className="flex flex-wrap gap-2">
                  {HAIR_STYLES.map(style => (
                    <button key={style.id} onClick={() => set('hairStyle', style.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${avatar.hairStyle === style.id ? 'bg-white text-purple-900' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Color</p>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map(color => (
                    <button key={color.value} onClick={() => set('hairColor', color.value)} title={color.label}
                      className={`w-8 h-8 rounded-full border-4 transition-all ${avatar.hairColor === color.value ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color.value }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eyes' && (
            <div>
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Eye Style</p>
              <div className="flex gap-3">
                {EYE_STYLES.map(style => (
                  <button key={style.id} onClick={() => set('eyeStyle', style.id)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${avatar.eyeStyle === style.id ? 'bg-white text-purple-900' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'outfit' && (
            <div>
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Outfit Color</p>
              <div className="flex flex-wrap gap-3">
                {OUTFITS.map(outfit => (
                  <button key={outfit.id} onClick={() => set('outfitId', outfit.id)} title={outfit.label}
                    className={`w-12 h-12 rounded-xl border-4 transition-all flex items-center justify-center ${avatar.outfitId === outfit.id ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: outfit.color }}>
                    {avatar.outfitId === outfit.id && <span className="text-white text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'accessory' && (
            <div>
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3">Accessory</p>
              <div className="flex flex-wrap gap-2">
                {ACCESSORIES.map(acc => (
                  <button key={acc.id} onClick={() => set('accessoryId', acc.id)}
                    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${avatar.accessoryId === acc.id ? 'bg-white text-purple-900' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                    <span className="text-2xl">{acc.emoji}</span>
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => onSave(avatar)}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-amber-500/30">
          Enter Adeline World! →
        </button>
      </div>
    </div>
  )
}
