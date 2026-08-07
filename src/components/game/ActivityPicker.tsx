// src/components/game/ActivityPicker.tsx
import { useState, useEffect } from 'react'
import { TownBuilding, ActivityType, Track, TRACK_LABELS } from '../../types/game'
import { getGaps, BrainGapsResponse } from '../../lib/brainClient'

const ACTIVITY_LABELS: Record<ActivityType, { label: string; mark: string; description: string }> = {
  story_mode: { label: 'Ask around', mark: '✦', description: 'Follow the people, records, and stories tied to this place.' },
  quiz_me:    { label: 'Check the evidence', mark: '⌕', description: 'Look closely. Notice what fits, what does not, and what is missing.' },
  build_it:   { label: 'Make something', mark: '⌁', description: 'Use what is here to repair, test, invent, or improve something.' },
  explore:    { label: 'Look around', mark: '◌', description: 'Wander first. There may be more here than the obvious route.' },
  mini_game:  { label: 'Take the challenge', mark: '◇', description: 'Jump into the problem and see how far you can get.' },
}

interface Props {
  building: TownBuilding
  studentId: string | null
  onSelect: (mode: ActivityType, track: Track | null, suggestedTopic: string | null) => void
  onClose: () => void
}

export default function ActivityPicker({ building, studentId, onSelect, onClose }: Props) {
  const [gaps, setGaps] = useState<BrainGapsResponse | null>(null)

  useEffect(() => {
    if (!studentId) return
    let cancelled = false
    getGaps(studentId).then(data => {
      if (!cancelled) setGaps(data)
    })
    return () => { cancelled = true }
  }, [studentId])

  const suggestedTopic = gaps?.suggested_daily_bread ?? null
  const track: Track | null =
    gaps?.priority_subject && Object.prototype.hasOwnProperty.call(TRACK_LABELS, gaps.priority_subject)
      ? (gaps.priority_subject as Track)
      : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#181611]/55 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-md mx-0 sm:mx-4 rounded-t-[32px] sm:rounded-[32px] px-6 pt-7 pb-6 overflow-hidden border border-[#322d25]/20 shadow-[0_24px_80px_rgba(20,18,14,.45)]"
        style={{
          backgroundColor: '#f5efdf',
          backgroundImage: 'radial-gradient(rgba(59,52,44,.08) .65px, transparent .65px), linear-gradient(92deg, transparent 0%, rgba(120,99,71,.035) 48%, transparent 100%)',
          backgroundSize: '5px 5px, 100% 100%'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -top-6 -right-4 text-[86px] text-[#2d2924]/[0.04] font-serif select-none">✦</div>
        <button onClick={onClose} className="absolute top-4 right-5 text-[#4e473e]/50 hover:text-[#2d2924] text-xl" aria-label="Close">×</button>

        <div className="pr-8 mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#6f6659] mb-2">{building.name}</p>
          <h2 className="font-serif text-[27px] leading-[1.05] text-[#29251f]">What do you notice first?</h2>
          <div className="mt-3 w-16 border-t-2 border-[#8b6b3f]/60" style={{ transform: 'rotate(-1deg)' }} />
          {suggestedTopic && (
            <p className="mt-4 text-[13px] leading-relaxed text-[#5b5349] italic max-w-[30ch]">
              There is a thread here worth following: {suggestedTopic}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          {building.activityTypes.map((type, index) => {
            const meta = ACTIVITY_LABELS[type]
            return (
              <button
                key={type}
                onClick={() => onSelect(type, track, suggestedTopic)}
                className="group w-full flex items-start gap-4 px-4 py-3.5 rounded-2xl text-left border border-[#40382d]/10 bg-white/25 hover:bg-white/55 hover:border-[#6f4d73]/30 transition-all"
                style={{ transform: `rotate(${index % 2 === 0 ? '-.18deg' : '.12deg'})` }}
              >
                <span className="w-8 h-8 shrink-0 rounded-full border border-[#2d2924]/25 flex items-center justify-center text-[#593d70] font-serif text-lg bg-[#fffaf0]/70">
                  {meta.mark}
                </span>
                <span>
                  <span className="block font-serif text-[17px] text-[#2e2922] leading-tight">{meta.label}</span>
                  <span className="block text-[11px] text-[#665e53] leading-snug mt-1 max-w-[34ch]">{meta.description}</span>
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-center mt-5 text-[10px] tracking-[0.15em] uppercase text-[#81776a]/70">Nothing here is a test until the world gives you a reason to care.</p>
      </div>
    </div>
  )
}
