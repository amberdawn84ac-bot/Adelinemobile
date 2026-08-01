import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { LifeMapEntry, TRACK_LABELS, TRACK_COLORS, Track } from '../types/game'
import { ArrowLeft, Users, BookOpen, Clock, Star } from 'lucide-react'
import { getTranscript, BrainTranscriptEntry } from '../lib/brainClient'

interface ChildStats {
  childId: string
  displayName: string
  username: string
  xp: number
  adeCoins: number
  avatarApproved: boolean
  usernameApproved: boolean
  recentEntries: LifeMapEntry[]
  totalEntries: number
}

export default function ParentDashboard() {
  const { children, parentAccount, signOut } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<ChildStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<ChildStats | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'activity' | 'transcript'>('activity')
  const [transcripts, setTranscripts] = useState<Record<string, BrainTranscriptEntry[]>>({})

  useEffect(() => {
    if (children.length > 0) loadStats()
    else setLoading(false)
  }, [children])

  async function loadStats() {
    setLoading(true)
    const results: ChildStats[] = []
    for (const child of children) {
      const { data: entries } = await supabase
        .from('aw_life_map_entries')
        .select('*')
        .eq('student_id', child.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { count } = await supabase
        .from('aw_life_map_entries')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', child.id)

      results.push({
        childId: child.id,
        displayName: child.display_name,
        username: child.username,
        xp: child.xp,
        adeCoins: child.ade_coins,
        avatarApproved: child.avatar_approved,
        usernameApproved: child.username_approved,
        recentEntries: (entries ?? []) as LifeMapEntry[],
        totalEntries: count ?? 0
      })
    }
    setStats(results)
    setLoading(false)
  }

  async function approveUsername(childId: string) {
    setApprovingId(childId)
    await supabase.from('aw_student_profiles').update({ username_approved: true }).eq('id', childId)
    await loadStats()
    setApprovingId(null)
  }

  async function approveAvatar(childId: string) {
    setApprovingId(childId)
    await supabase.from('aw_student_profiles').update({ avatar_approved: true }).eq('id', childId)
    await loadStats()
    setApprovingId(null)
  }

  async function loadTranscript(childId: string) {
    if (transcripts[childId] !== undefined) return  // already loaded
    const entries = await getTranscript(childId)
    setTranscripts(prev => ({ ...prev, [childId]: entries }))
  }

  const pendingApprovals = stats.filter(s => !s.usernameApproved || !s.avatarApproved)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800">Parent Dashboard</h1>
            <p className="text-xs text-slate-500">Hi {parentAccount?.display_name}</p>
          </div>
        </div>
        <button
          onClick={() => { signOut(); navigate('/') }}
          className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100"
        >
          Sign Out
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {pendingApprovals.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3">
            <h2 className="font-bold text-amber-900 flex items-center gap-2">
              <Star className="w-4 h-4" /> Action Needed
            </h2>
            {pendingApprovals.map(s => (
              <div key={s.childId} className="bg-white rounded-xl p-3 space-y-2">
                <p className="font-semibold text-slate-800 text-sm">{s.displayName}</p>
                <div className="flex flex-wrap gap-2">
                  {!s.usernameApproved && (
                    <button
                      onClick={() => approveUsername(s.childId)}
                      disabled={approvingId === s.childId}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-bold rounded-lg"
                    >
                      Approve username: @{s.username}
                    </button>
                  )}
                  {!s.avatarApproved && (
                    <button
                      onClick={() => approveAvatar(s.childId)}
                      disabled={approvingId === s.childId}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-bold rounded-lg"
                    >
                      Approve avatar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <h2 className="font-bold text-slate-700 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" /> Your Kids
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No kids added yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.map(s => (
                <button
                  key={s.childId}
                  onClick={() => setSelectedChild(selectedChild?.childId === s.childId ? null : s)}
                  className="w-full bg-white rounded-2xl p-4 border border-slate-200 text-left hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{s.displayName}</p>
                      <p className="text-xs text-slate-500">@{s.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-600 font-bold text-sm">{s.xp} XP</p>
                      <p className="text-slate-500 text-xs">{s.adeCoins} AdeCoins</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <BookOpen className="w-3 h-3" />
                      <span>{s.totalEntries} activities logged</span>
                    </div>
                    {(!s.usernameApproved || !s.avatarApproved) && (
                      <span className="text-xs text-amber-600 font-semibold">⚠ Needs approval</span>
                    )}
                  </div>

                  {selectedChild?.childId === s.childId && (
                    <div className="mt-3 pt-3 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                      {/* Tab bar */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setActiveTab('activity')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'activity' ? 'bg-amber-100 text-amber-800' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Activity Log
                        </button>
                        <button
                          onClick={() => { setActiveTab('transcript'); loadTranscript(s.childId) }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'transcript' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Transcript
                        </button>
                      </div>

                      {activeTab === 'activity' && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Recent Activity</p>
                          {s.recentEntries.map(entry => (
                            <div key={entry.id} className="bg-slate-50 rounded-xl p-3">
                              <p className="text-slate-700 text-sm">{entry.description}</p>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex flex-wrap gap-1">
                                  {entry.tracks.map(t => (
                                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: TRACK_COLORS[t as Track] }}>
                                      {TRACK_LABELS[t as Track]}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(entry.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                          {s.recentEntries.length === 0 && <p className="text-slate-400 text-xs">No activity yet.</p>}
                        </div>
                      )}

                      {activeTab === 'transcript' && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">CASE Transcript Credits</p>
                          {transcripts[s.childId] === undefined ? (
                            <p className="text-slate-400 text-xs">Loading...</p>
                          ) : transcripts[s.childId].length === 0 ? (
                            <p className="text-slate-400 text-xs">No verified credits yet. Complete room missions to earn transcript credits.</p>
                          ) : (
                            transcripts[s.childId].map(entry => (
                              <div key={entry.id} className="bg-slate-50 rounded-xl p-3">
                                <p className="text-slate-700 text-sm font-semibold">{entry.title ?? 'Lesson'}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] px-2 py-0.5 rounded-full text-white bg-emerald-600">
                                    {TRACK_LABELS[entry.track as Track] ?? entry.track}
                                  </span>
                                  <span className="text-emerald-700 text-xs font-bold">{entry.credits} cr</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
