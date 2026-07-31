import { useMemo, useRef } from 'react'
import { LifeMapEntry, GradeBand, TRACK_LABELS, GRADE_EXPECTATIONS } from '../../types/game'
import { buildCreditSummary, checkGraduationEligible } from '../../lib/academicEngine'

interface Props {
  entries: LifeMapEntry[]
  studentName: string
  gradeBand: GradeBand
  parentName: string
  onClose: () => void
}

export default function Transcript({ entries, studentName, gradeBand, parentName, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const summary = useMemo(() => buildCreditSummary(entries, gradeBand), [entries, gradeBand])
  const graduation = useMemo(() => checkGraduationEligible(entries, gradeBand), [entries, gradeBand])
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const expectation = GRADE_EXPECTATIONS.find(g => g.band === gradeBand)!

  const bandLabel: Record<GradeBand, string> = {
    'K-2':  'Kindergarten through 2nd Grade',
    '3-5':  '3rd through 5th Grade',
    '6-8':  '6th through 8th Grade',
    '9-12': '9th through 12th Grade'
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10 print:hidden">
        <h2 className="text-white font-bold text-xl font-serif">📄 Transcript</h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl">
            🖨️ Print / Save PDF
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl px-2">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div ref={printRef} className="max-w-2xl mx-auto bg-white rounded-2xl p-8 space-y-6 print:rounded-none print:p-6">
          <div className="text-center border-b border-slate-200 pb-6">
            <h1 className="text-2xl font-bold text-slate-900 font-serif">Academic Transcript</h1>
            <p className="text-slate-500 text-sm mt-1">Dear Adeline Homeschool · Adeline World</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 font-semibold">Student</p>
              <p className="text-slate-900 font-bold text-lg">{studentName}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold">Parent / Guardian</p>
              <p className="text-slate-900">{parentName}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold">Grade Level</p>
              <p className="text-slate-900">{bandLabel[gradeBand]}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold">Date Issued</p>
              <p className="text-slate-900">{today}</p>
            </div>
          </div>

          <div>
            <h2 className="font-bold text-slate-800 text-lg mb-3 border-b border-slate-200 pb-2">Credit Summary</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-600 font-semibold">Subject Area</th>
                  <th className="text-right py-2 text-slate-600 font-semibold">Credits</th>
                  <th className="text-right py-2 text-slate-600 font-semibold">Activities</th>
                  <th className="text-right py-2 text-slate-600 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(item => (
                  <tr key={item.track} className="border-b border-slate-100">
                    <td className="py-2 text-slate-800">{TRACK_LABELS[item.track]}</td>
                    <td className="py-2 text-right text-slate-800 font-mono">{item.credits.toFixed(1)}</td>
                    <td className="py-2 text-right text-slate-500">{item.entriesCount}</td>
                    <td className="py-2 text-right">
                      {item.meetsYearGoal
                        ? <span className="text-emerald-600 font-semibold">✓ Complete</span>
                        : <span className="text-amber-600">In Progress</span>
                      }
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 font-bold">
                  <td className="py-2 text-slate-900">TOTAL</td>
                  <td className="py-2 text-right font-mono text-slate-900">
                    {summary.reduce((s, i) => s + i.credits, 0).toFixed(1)}
                  </td>
                  <td className="py-2 text-right text-slate-500">{entries.length}</td>
                  <td className="py-2 text-right">
                    {graduation.eligible
                      ? <span className="text-emerald-600 font-bold">✓ Year Complete</span>
                      : <span className="text-slate-500">–</span>
                    }
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-slate-400 text-xs mt-2">
              Required: {expectation.minCreditsPerYear} credits/year across {expectation.requiredTracks.length} subject areas
            </p>
          </div>

          <div>
            <h2 className="font-bold text-slate-800 text-lg mb-3 border-b border-slate-200 pb-2">Selected Accomplishments</h2>
            <div className="space-y-2">
              {entries.slice(0, 15).map(entry => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <span className="text-slate-400 shrink-0">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-slate-700">{entry.description}</span>
                </div>
              ))}
              {entries.length > 15 && (
                <p className="text-slate-400 text-xs">+ {entries.length - 15} more activities on record</p>
              )}
            </div>
          </div>

          {graduation.eligible && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-emerald-800 font-bold">🎓 Year Requirements Satisfied</p>
              <p className="text-emerald-600 text-sm mt-1">
                {studentName} has met all requirements for {bandLabel[gradeBand]}.
              </p>
            </div>
          )}

          <div className="border-t border-slate-200 pt-6 flex justify-between text-sm text-slate-500">
            <div>
              <div className="border-b border-slate-400 w-48 mb-1" />
              <p>Parent / Guardian Signature</p>
            </div>
            <div className="text-right">
              <p>Generated by Adeline World</p>
              <p>{today}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
