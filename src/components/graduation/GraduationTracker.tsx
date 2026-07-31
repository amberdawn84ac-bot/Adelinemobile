import { useMemo } from 'react'
import { LifeMapEntry, GradeBand, TRACK_LABELS, TRACK_COLORS } from '../../types/game'
import { buildCreditSummary, checkGraduationEligible, getYearProgress } from '../../lib/academicEngine'

interface Props {
  entries: LifeMapEntry[]
  gradeBand: GradeBand
  studentName: string
  onClose: () => void
}

export default function GraduationTracker({ entries, gradeBand, studentName, onClose }: Props) {
  const summary = useMemo(() => buildCreditSummary(entries, gradeBand), [entries, gradeBand])
  const graduation = useMemo(() => checkGraduationEligible(entries, gradeBand), [entries, gradeBand])
  const yearProgress = useMemo(() => getYearProgress(entries, gradeBand), [entries, gradeBand])

  const bandLabel: Record<GradeBand, string> = {
    'K-2':  'Kindergarten–2nd Grade',
    '3-5':  '3rd–5th Grade',
    '6-8':  '6th–8th Grade',
    '9-12': '9th–12th Grade (High School)'
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-bold text-xl font-serif">🎓 Learning Path</h2>
          <p className="text-white/50 text-xs mt-0.5">{studentName} · {bandLabel[gradeBand]}</p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white text-2xl px-2">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-bold">Year Progress</p>
            <p className="text-amber-300 font-bold text-sm">{yearProgress}%</p>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${yearProgress}%`,
                background: yearProgress >= 100 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #f97316)'
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-white/50 text-xs">{graduation.totalCredits} credits earned</p>
            <p className="text-white/50 text-xs">{graduation.creditsNeeded > 0 ? `${graduation.creditsNeeded} more needed` : '✓ Year goal met!'}</p>
          </div>
        </div>

        {graduation.eligible ? (
          <div className="bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl p-5 text-center space-y-2">
            <p className="text-5xl">🎓</p>
            <p className="text-emerald-300 font-bold text-xl">Graduation Unlocked!</p>
            <p className="text-white/70 text-sm">
              {studentName} has completed all required tracks for {bandLabel[gradeBand]}.
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-white font-semibold text-sm mb-1">Path to Graduation</p>
            <p className="text-white/50 text-xs">
              {graduation.tracksComplete}/{graduation.tracksRequired} tracks complete ·{' '}
              {graduation.creditsNeeded} credits remaining
            </p>
          </div>
        )}

        <div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Track Progress</p>
          <div className="space-y-3">
            {summary.map(item => (
              <div key={item.track} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-semibold">{TRACK_LABELS[item.track]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-xs">{item.credits} cr · {item.entriesCount} entries</span>
                    {item.meetsYearGoal && <span className="text-emerald-400 text-xs">✓</span>}
                  </div>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, item.meetsYearGoal ? 100 : (item.credits / (item.credits + item.creditsNeeded)) * 100)}%`,
                      backgroundColor: TRACK_COLORS[item.track]
                    }}
                  />
                </div>
                {!item.meetsYearGoal && (
                  <p className="text-white/30 text-xs mt-1">{item.creditsNeeded} more credits needed</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
