import { useMemo, useState } from 'react'
import { OPEN_LEARNING_RESOURCES, RESOURCE_POLICY_LABELS, ResourceKind } from '../../data/openLearningResources'

interface OpenLearningVaultProps {
  onClose: () => void
}

const KIND_LABELS: Record<ResourceKind | 'all', string> = {
  all: 'All',
  curriculum: 'Curriculum',
  game: 'Games',
  simulation: 'Simulations',
  primary_sources: 'Primary Sources',
  coding: 'Coding',
  reference: 'Reference',
}

export default function OpenLearningVault({ onClose }: OpenLearningVaultProps) {
  const [kind, setKind] = useState<ResourceKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const resources = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return OPEN_LEARNING_RESOURCES.filter(resource => {
      const matchesKind = kind === 'all' || resource.kind === kind
      const matchesQuery = !normalized || [
        resource.title,
        resource.provider,
        resource.description,
        ...resource.subjects,
      ].some(value => value.toLowerCase().includes(normalized))
      return matchesKind && matchesQuery
    })
  }, [kind, query])

  const selected = OPEN_LEARNING_RESOURCES.find(resource => resource.id === selectedId) ?? null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl h-[92vh] bg-[#f8f5ee] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <header className="px-5 py-4 sm:px-7 sm:py-5 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-amber-300 font-bold">Dear Adeline Resource Wing</div>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">Open Learning Vault</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">Good outside tools, curriculum, games, simulations, and primary sources. The license badge tells us whether to link, inspect, or reuse.</p>
          </div>
          <button onClick={onClose} aria-label="Close Open Learning Vault" className="shrink-0 rounded-full bg-white/10 hover:bg-white/20 w-10 h-10 text-xl transition-colors">×</button>
        </header>

        <div className="px-5 py-3 sm:px-7 bg-amber-50 border-b border-amber-200 text-xs sm:text-sm text-amber-950">
          <strong>Rule of the Vault:</strong> free does not automatically mean copyable. External material stays external unless the exact license permits the way Dear Adeline wants to use it.
        </div>

        <div className="px-5 pt-4 sm:px-7 flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search science, justice, coding, history..."
            className="w-full sm:max-w-sm rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(KIND_LABELS) as Array<ResourceKind | 'all'>).map(item => (
              <button
                key={item}
                onClick={() => setKind(item)}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition-colors ${kind === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'}`}
              >
                {KIND_LABELS[item]}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resources.map(resource => {
              const policy = RESOURCE_POLICY_LABELS[resource.policy]
              return (
                <article key={resource.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{resource.provider}</div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mt-1">{resource.title}</h3>
                    </div>
                    {resource.featured && <span className="text-[10px] font-bold bg-amber-100 text-amber-900 rounded-full px-2 py-1">Featured</span>}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">{resource.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {resource.subjects.slice(0, 5).map(subject => (
                      <span key={subject} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">{subject}</span>
                    ))}
                  </div>

                  <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                    <button onClick={() => setSelectedId(resource.id)} className="text-xs font-bold text-slate-700 hover:text-black underline underline-offset-2">Mission ideas</button>
                    <div className="flex items-center gap-2">
                      <span title={resource.licenseNote} className={`text-[10px] font-bold rounded-full px-2 py-1 ${resource.policy === 'OPEN_REUSE' ? 'bg-emerald-100 text-emerald-900' : resource.policy === 'LINK' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'}`}>
                        {policy.short}
                      </span>
                      <a href={resource.url} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-black hover:bg-slate-700 transition-colors">Open ↗</a>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {resources.length === 0 && (
            <div className="text-center py-20 text-slate-500">Nothing in the Vault matches that search yet.</div>
          )}
        </main>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] bg-slate-950/65 flex items-center justify-center p-4" onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6" onClick={event => event.stopPropagation()}>
            <div className="flex justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Mission Wrapper</div>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{selected.title}</h3>
              </div>
              <button onClick={() => setSelectedId(null)} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200">×</button>
            </div>

            <div className="mt-5 space-y-3">
              {selected.missionIdeas.map((idea, index) => (
                <div key={idea} className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex gap-3">
                  <span className="font-black text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                  <p className="text-sm text-slate-800">{idea}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <div className="text-xs font-black text-amber-950">LICENSE NOTE</div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">{selected.licenseNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
