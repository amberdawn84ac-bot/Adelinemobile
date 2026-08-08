import { useState } from 'react'
import { AvatarData, AvatarCharacter, DEFAULT_AVATAR } from '../../types/game'
import AvatarRenderer, { ALL_PORTRAITS } from './AvatarRenderer'

interface Props {
  initialAvatar?: AvatarData
  playerName: string
  onSave: (avatar: AvatarData) => void
}

const ACCENT_COLORS = [
  { label: 'Garnet',   value: '#8d3451' },
  { label: 'Sapphire', value: '#315d78' },
  { label: 'Emerald',  value: '#2f725d' },
  { label: 'Amethyst', value: '#654a7b' },
  { label: 'Amber',    value: '#b8872f' },
  { label: 'Peacock',  value: '#276f73' },
  { label: 'Mulberry', value: '#733f63' },
  { label: 'Clay',     value: '#9a5b43' },
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
    <div className="relative min-h-screen overflow-hidden bg-[#d9d0bc] px-4 py-8 text-[#2f2923] sm:py-12">
      <div className="absolute inset-0 opacity-35" style={{backgroundImage:'radial-gradient(#463b31 .6px, transparent .7px)',backgroundSize:'5px 5px'}} />
      <div className="absolute -left-24 top-[8%] h-72 w-72 rounded-full bg-[#315d78]/10 blur-3xl" />
      <div className="absolute -right-20 bottom-[4%] h-80 w-80 rounded-full bg-[#733f63]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mb-7 text-center">
          <p className="font-serif text-[10px] uppercase tracking-[.3em] text-[#756958]">Dear Adeline</p>
          <h1 className="mt-2 font-serif text-3xl text-[#29231e] sm:text-4xl">Who are you today?</h1>
          <p className="mt-2 font-serif text-sm italic text-[#6e6253]">Pick a face. You can change it later.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="h-fit rounded-[28px_20px_30px_18px] border border-[#40362d]/20 bg-[#f1e8d4]/90 p-6 shadow-[0_20px_55px_rgba(55,44,32,.18)]">
            <div className="mx-auto flex h-[180px] w-[180px] items-center justify-center rounded-[34px_28px_38px_25px] border border-[#40362d]/15 bg-[#fff9eb]/55 shadow-inner">
              <AvatarRenderer avatar={avatar} size={150} />
            </div>
            <p className="mt-5 text-center font-serif text-lg">{playerName}</p>
            <div className="mx-auto mt-4 h-px w-20 bg-[#4d4237]/20" />
            <p className="mt-4 text-center font-serif text-[10px] uppercase tracking-[.2em] text-[#756958]">your color</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2.5">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => selectColor(c.value)}
                  title={c.label}
                  className={`h-8 w-8 rounded-full border transition ${avatar.displayColor === c.value ? 'scale-110 border-[#342d26] ring-2 ring-[#fff8e7]' : 'border-[#342d26]/15'}`}
                  style={{backgroundColor:c.value}}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[22px_30px_18px_28px] border border-[#40362d]/20 bg-[#f3ead8]/88 p-5 shadow-[0_20px_55px_rgba(55,44,32,.16)] sm:p-6">
            <p className="mb-4 font-serif text-[10px] uppercase tracking-[.24em] text-[#756958]">faces in town</p>
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-6">
              {ALL_PORTRAITS.map((char, index) => (
                <button
                  key={char}
                  onClick={() => selectCharacter(char)}
                  aria-label={`Choose character ${index + 1}`}
                  className={`relative aspect-square overflow-hidden rounded-[14px_11px_16px_10px] border transition ${avatar.character === char ? 'scale-[1.04] border-[#3b332b] bg-[#e6d7bb] shadow-lg' : 'border-[#40362d]/10 bg-[#fff9eb]/30 hover:border-[#40362d]/30'}`}
                  style={{transform:`rotate(${index % 3 === 0 ? '-.5deg' : index % 3 === 1 ? '.35deg' : '0deg'})`}}
                >
                  <AvatarRenderer avatar={{character:char,displayColor:avatar.displayColor}} size={110} className="border-0" />
                  {avatar.character === char && <span className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full border border-[#fff9eb]" style={{backgroundColor:avatar.displayColor}} />}
                </button>
              ))}
            </div>

            <button
              onClick={() => onSave(avatar)}
              className="mx-auto mt-7 block rounded-full border border-[#315d58]/25 bg-[#315d58] px-8 py-3 font-serif text-sm text-[#fff8e8] shadow-lg transition hover:bg-[#284f4b]"
            >
              walk into town
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
