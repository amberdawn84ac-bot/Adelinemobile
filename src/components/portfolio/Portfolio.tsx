import { useMemo } from 'react'
import { LifeMapEntry, Track, TRACK_LABELS, TRACK_COLORS, GradeBand } from '../../types/game'
import { buildPortfolio, buildCreditSummary } from '../../lib/academicEngine'

interface Props {
  entries: LifeMapEntry[]
  studentName: string
  gradeBand: GradeBand
  onClose: () => void
  onExport: () => void
}

export default function Portfolio({ entries, studentName, gradeBand, onClose, onExport }: Props) {
  const portfolio = useMemo(() => buildPortfolio(entries), [entries])
  const creditSummary = useMemo(() => buildCreditSummary(entries, gradeBand), [entries, gradeBand])
  const totalCredits = creditSummary.reduce((sum, s) => sum + s.credits, 0)

  const byTrack: Partial<Record<Track, typeof portfolio>> = {}
  for (const item of portfolio) {
    for (const track of item.tracks) {
      if (!byTrack[track]) byTrack[track] = []
      byTrack[track]!.push(item)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-bold text-xl font-serif">📁 Portfolio</h2>
          <p className="text-white/50 text-xs mt-0.5">
            {studentName} · {portfolio.length} accomplishments · {Math.round(totalCredits * 10) / 10} credits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onExport} className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl">
            Export →
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl px-2">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {portfolio.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-5xl">📁</p>
            <p className="text-white font-bold text-lg">Portfolio is empty</p>
            <p className="text-white/50 text-sm max-w-xs mx-auto">
              Tell Adeline what you've done — built, grown, cooked, written, coded — and it goes here.
            </p>
          </div>
        ) : (
          Object.entries(byTrack).map(([track, items]) => (
            <div key={track} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TRACK_COLORS[track as Track] }} />
                <p className="text-white font-bold text-sm">{TRACK_LABELS[track as Track]}</p>
                <span className="text-white/30 text-xs">{items!.length} entries</span>
              </div>
              <div className="space-y-2 ml-5">
                {items!.map(item => (
                  <div key={item.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-white/90 text-sm">{item.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-amber-300 text-xs">{item.credits} credits</span>
                      <span className="text-white/30 text-xs">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
