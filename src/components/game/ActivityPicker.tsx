// src/components/game/ActivityPicker.tsx
import { useState, useEffect } from 'react'
import { TownBuilding, ActivityType, Track } from '../../types/game'
import { getGaps, BrainGapsResponse } from '../../lib/brainClient'

const ACTIVITY_LABELS: Record<ActivityType, { label: string; emoji: string; description: string }> = {
  story_mode: { label: 'Story Mode',  emoji: '📖', description: 'Read, write, and reflect' },
  quiz_me:    { label: 'Quiz Me',     emoji: '⚡', description: 'Fast questions, instant feedback' },
  build_it:   { label: 'Build It',    emoji: '🔨', description: 'Make something real' },
  explore:    { label: 'Explore',     emoji: '🔭', description: 'Follow your curiosity' },
  mini_game:  { label: 'Mini Game',   emoji: '🎮', description: 'Play and learn' },
}

const TRACK_DISPLAY: Record<string, string> = {
  APPLIED_MATHEMATICS:  'Math',
  CREATION_SCIENCE:     'Science',
  ENGLISH_LITERATURE:   'Language Arts',
  TRUTH_HISTORY:        'History',
  HOMESTEADING:         'Homesteading',
  HEALTH_NATUROPATHY:   'Health',
  GOVERNMENT_ECONOMICS: 'Economics',
  JUSTICE_CHANGEMAKING: 'Justice',
  DISCIPLESHIP:         'Discipleship',
  CREATIVE_ECONOMY:     'Creative Economy',
}

interface Props {
  building: TownBuilding
  studentId: string | null
  onSelect: (mode: ActivityType, track: Track | null, suggestedTopic: string | null) => void
  onClose: () => void
}

export default function ActivityPicker({ building, studentId, onSelect, onClose }: Props) {
  const [gaps, setGaps] = useState<BrainGapsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    getGaps(studentId).then(data => {
      setGaps(data)
      setLoading(false)
    })
  }, [studentId])

  const subjectLabel = gaps ? (TRACK_DISPLAY[gaps.priority_subject] ?? gaps.priority_subject) : null
  const suggestedTopic = gaps?.suggested_daily_bread ?? null
  const track = gaps?.priority_subject as Track | null ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 mx-4 max-w-sm w-full border-4"
        style={{ borderColor: building.color }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <span className="text-5xl">{building.emoji}</span>
          <h2 className="font-black text-slate-800 text-xl mt-2">{building.name}</h2>

          {loading ? (
            <p className="text-slate-400 text-sm mt-1 animate-pulse">Checking what you need next...</p>
          ) : subjectLabel ? (
            <div className="mt-2 bg-amber-50 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Up next</p>
              <p className="text-slate-700 text-sm font-bold">{subjectLabel}</p>
              {suggestedTopic && (
                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{suggestedTopic}</p>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mt-1">{building.description}</p>
          )}
        </div>

        {/* Activity buttons */}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">
          How do you want to learn?
        </p>
        <div className="space-y-2">
          {building.activityTypes.map(type => {
            const meta = ACTIVITY_LABELS[type]
            return (
              <button
                key={type}
                onClick={() => onSelect(type, track, suggestedTopic)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all text-left"
              >
                <span className="text-2xl">{meta.emoji}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{meta.label}</p>
                  <p className="text-slate-400 text-xs">{meta.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-slate-400 text-xs hover:text-slate-600 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
