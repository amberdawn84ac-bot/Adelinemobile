import { useState, useEffect } from 'react'
import { TownBuilding, ActivityType, Track, TRACK_LABELS } from '../../types/game'
import { getGaps, BrainGapsResponse } from '../../lib/brainClient'

const PLACE_NAMES: Record<string,string> = {
  adelines_kitchen:"Adeline's Place",
  the_library:'Library & Archives',
  the_arena:'The Old Hall',
  the_makers_lab:'Workshop',
  the_creek_and_woods:'Creek & Woods',
  the_market:'Main Street Market',
  the_chapel:'The Chapel',
}

const ACTIVITY_LABELS: Record<ActivityType, { label: string; mark: string; description: string }> = {
  story_mode: { label: 'Ask around', mark: '✦', description: 'People, records, old notes, and the stories attached to this place.' },
  quiz_me:    { label: 'Check what fits', mark: '⌕', description: 'Look closely at the facts and see where something stops adding up.' },
  build_it:   { label: 'Put your hands on it', mark: '⌁', description: 'Repair it, test it, measure it, make it work better.' },
  explore:    { label: 'Look around', mark: '◌', description: 'Wander first. The useful thing may not be the obvious thing.' },
  mini_game:  { label: 'Try it', mark: '◇', description: 'Get into the problem and learn what it does by doing it.' },
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
    getGaps(studentId).then(data => { if (!cancelled) setGaps(data) })
    return () => { cancelled = true }
  }, [studentId])

  const suggestedTopic = gaps?.suggested_daily_bread ?? null
  const track: Track | null = gaps?.priority_subject && Object.prototype.hasOwnProperty.call(TRACK_LABELS, gaps.priority_subject)
    ? (gaps.priority_subject as Track)
    : null
  const placeName = PLACE_NAMES[building.id] ?? building.name

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#181611]/45 backdrop-blur-[1px] sm:items-center" onClick={onClose}>
      <div
        className="relative mx-0 w-full overflow-hidden rounded-t-[28px] border border-[#322d25]/20 px-6 pb-6 pt-7 shadow-[0_24px_80px_rgba(20,18,14,.42)] sm:mx-4 sm:max-w-md sm:rounded-[28px_22px_30px_20px]"
        style={{backgroundColor:'#f3ecd9',backgroundImage:'radial-gradient(rgba(59,52,44,.08) .65px, transparent .65px)',backgroundSize:'5px 5px'}}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-5 top-4 text-xl text-[#4e473e]/45 hover:text-[#2d2924]" aria-label="Close">×</button>
        <div className="mb-5 pr-8">
          <p className="mb-2 text-[9px] uppercase tracking-[0.27em] text-[#756a5c]">{placeName}</p>
          <h2 className="font-serif text-[25px] leading-[1.08] text-[#29251f]">Where do you start?</h2>
          {suggestedTopic && <p className="mt-3 max-w-[32ch] font-serif text-[12px] italic leading-relaxed text-[#62584c]">A loose thread: {suggestedTopic}</p>}
        </div>

        <div className="space-y-2">
          {building.activityTypes.map((type, index) => {
            const meta = ACTIVITY_LABELS[type]
            return (
              <button
                key={type}
                onClick={() => onSelect(type, track, suggestedTopic)}
                className="group flex w-full items-start gap-3 rounded-[15px_12px_17px_11px] border border-[#40382d]/10 bg-white/20 px-4 py-3 text-left transition hover:border-[#5c3e68]/25 hover:bg-white/45"
                style={{transform:`rotate(${index % 2 === 0 ? '-.12deg' : '.1deg'})`}}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2d2924]/20 bg-[#fffaf0]/55 font-serif text-lg text-[#5f426d]">{meta.mark}</span>
                <span>
                  <span className="block font-serif text-[16px] leading-tight text-[#2e2922]">{meta.label}</span>
                  <span className="mt-1 block max-w-[34ch] text-[10px] leading-snug text-[#6d6357]">{meta.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
