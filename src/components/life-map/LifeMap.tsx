import { useState, useEffect } from 'react'
import { LifeMapEntry, Track, TRACK_LABELS, TRACK_COLORS } from '../../types/game'
import { getLifeMapByTrack } from '../../lib/lifeMapService'

interface Props {
  studentId: string | null
  localEntries: LifeMapEntry[]
  onClose: () => void
}

const ALL_TRACKS: Track[] = [
  'CREATION_SCIENCE', 'HEALTH_NATUROPATHY', 'HOMESTEADING',
  'GOVERNMENT_ECONOMICS', 'JUSTICE_CHANGEMAKING', 'DISCIPLESHIP',
  'TRUTH_HISTORY', 'ENGLISH_LITERATURE', 'APPLIED_MATHEMATICS', 'CREATIVE_ECONOMY'
]

export default function LifeMap({ studentId, localEntries, onClose }: Props) {
  const [byTrack, setByTrack] = useState<Partial<Record<Track, LifeMapEntry[]>>>({})
  const [loading, setLoading] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)

  useEffect(() => {
    loadEntries()
  }, [studentId, localEntries])

  async function loadEntries() {
    setLoading(true)
    let entries: Partial<Record<Track, LifeMapEntry[]>> = {}

    if (studentId) {
      entries = await getLifeMapByTrack(studentId)
    }

    for (const entry of localEntries) {
      for (const track of entry.tracks) {
        if (!entries[track]) entries[track] = []
        if (!entries[track]!.find(e => e.id === entry.id)) {
          entries[track]!.unshift(entry)
        }
      }
    }

    setByTrack(entries)
    setLoading(false)
  }

  const allEntries = Object.values(byTrack).flat()
  const uniqueEntries = allEntries.filter((v, i, a) => a.findIndex(e => e.id === v.id) === i)
  const totalEntries = uniqueEntries.length
  const tracksActive = ALL_TRACKS.filter(t => (byTrack[t]?.length ?? 0) > 0).length

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-bold text-xl font-serif">✨ Your Life Map</h2>
          <p className="text-white/50 text-xs mt-0.5">{totalEntries} accomplishments · {tracksActive}/10 tracks explored</p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white text-2xl px-2">✕</button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {totalEntries === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-5xl">🗺️</p>
              <p className="text-white font-bold text-lg">Your Life Map is empty</p>
              <p className="text-white/50 text-sm max-w-xs mx-auto">
                Tell Adeline what you've been doing — canning, building, reading, farming — and she'll add it here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {ALL_TRACKS.map(track => {
                  const entries = byTrack[track] ?? []
                  const active = entries.length > 0
                  return (
                    <button
                      key={track}
                      onClick={() => setSelectedTrack(active ? track : null)}
                      className={`rounded-2xl p-3 text-left transition-all border ${
                        active
                          ? 'border-white/20 hover:border-white/40 hover:scale-[1.02]'
                          : 'border-white/5 opacity-30'
                      }`}
                      style={{ backgroundColor: active ? `${TRACK_COLORS[track]}33` : 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{TRACK_LABELS[track]}</span>
                        {active && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: TRACK_COLORS[track] }}
                          >
                            {entries.length}
                          </span>
                        )}
                      </div>
                      {active && (
                        <p className="text-white/60 text-xs truncate">{entries[0].description}</p>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedTrack && (byTrack[selectedTrack]?.length ?? 0) > 0 && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold">{TRACK_LABELS[selectedTrack]}</h3>
                    <button onClick={() => setSelectedTrack(null)} className="text-white/40 text-sm">✕</button>
                  </div>
                  <div className="space-y-2">
                    {byTrack[selectedTrack]!.map(entry => (
                      <div key={entry.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <p className="text-white/90 text-sm">{entry.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-white/40 text-xs">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-amber-300 text-xs">+{entry.xp_awarded} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
