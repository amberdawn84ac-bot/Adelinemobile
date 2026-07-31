import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AvatarData, RoomId, DEFAULT_AVATAR, LifeMapEntry, SEASON_TIERS, Track } from '../types/game'
import AvatarBuilder from '../components/avatar/AvatarBuilder'
import GameHUD from '../components/hud/GameHUD'
import AdelineChat from '../components/chat/AdelineChat'
import HubWorld from '../components/world/HubWorld'
import LifeMap from '../components/life-map/LifeMap'
import SeasonPass from '../components/season-pass/SeasonPass'
import RoomMission from '../components/rooms/RoomMission'
import MathMines from '../components/rooms/MathMines'
import StoryForest from '../components/rooms/StoryForest'
import ScienceLab from '../components/rooms/ScienceLab'
import HomesteadFarm from '../components/rooms/HomesteadFarm'
import TruthArchive from '../components/rooms/TruthArchive'
import { supabase } from '../lib/supabase'
import { logActivity, getLifeMap } from '../lib/lifeMapService'
import MiniWorld from '../components/world/MiniWorld'
import GraduationTracker from '../components/graduation/GraduationTracker'
import Portfolio from '../components/portfolio/Portfolio'
import Transcript from '../components/transcript/Transcript'
import { gradeBandFromAge, getYearProgress } from '../lib/academicEngine'
import { GradeBand } from '../types/game'

type GameScreen = 'avatar_builder' | 'chat' | 'hub' | 'room'
type Overlay = 'life_map' | 'season_pass' | 'graduation' | 'portfolio' | null

const ROOM_CONFIG: Record<RoomId, { label: string; emoji: string; tracks: Track[]; context: string }> = {
  math_mines:     { label: 'Math Mines',      emoji: '⛏️', tracks: ['APPLIED_MATHEMATICS'],                    context: 'Focus on real-world math: farming budgets, measurements, building calculations, market pricing.' },
  story_forest:   { label: 'Story Forest',    emoji: '🌲', tracks: ['ENGLISH_LITERATURE'],                     context: 'Focus on reading, writing, storytelling, rhetoric, and comprehension.' },
  science_lab:    { label: 'Science Lab',     emoji: '🔬', tracks: ['CREATION_SCIENCE'],                       context: 'Focus on creation science, nature observation, household experiments, animal biology.' },
  homestead_farm: { label: 'Homestead Farm',  emoji: '🌾', tracks: ['HOMESTEADING', 'APPLIED_MATHEMATICS'],    context: 'Focus on farming, animal husbandry, canning, building, selling at market, off-grid living.' },
  truth_archive:  { label: 'Truth Archive',   emoji: '📜', tracks: ['TRUTH_HISTORY', 'JUSTICE_CHANGEMAKING'], context: 'Focus on primary source history, follow the money, who profits, real unfiltered events.' },
}

function parseAvatar(data: Record<string, unknown>): AvatarData | null {
  if (!data || !data.character) return null
  return data as unknown as AvatarData
}

export default function GameShell() {
  const { activeChild, guestSession, signOut, parentAccount } = useAuth()
  const navigate = useNavigate()

  const storedAvatar = activeChild?.avatar_data ? parseAvatar(activeChild.avatar_data as Record<string, unknown>) : null
  const guestAvatarRaw = guestSession?.avatarData
  const guestAvatar = guestAvatarRaw && Object.keys(guestAvatarRaw).length > 0
    ? parseAvatar(guestAvatarRaw as Record<string, unknown>) : null
  const hasAvatar = storedAvatar !== null || guestAvatar !== null

  const [screen, setScreen] = useState<GameScreen>(hasAvatar ? 'chat' : 'avatar_builder')
  const [avatarData, setAvatarData] = useState<AvatarData>(storedAvatar ?? guestAvatar ?? DEFAULT_AVATAR)
  const [currentRoom, setCurrentRoom] = useState<RoomId | null>(null)
  const [roomMode, setRoomMode] = useState<'quiz' | 'mission'>('mission')
  const [localXP, setLocalXP] = useState(activeChild?.xp ?? guestSession?.xp ?? 0)
  const [localCoins, setLocalCoins] = useState(activeChild?.ade_coins ?? guestSession?.adeCoins ?? 0)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [lifeMapEntries, setLifeMapEntries] = useState<LifeMapEntry[]>([])
  const [claimedTiers, setClaimedTiers] = useState<number[]>([])
  const [showRooms, setShowRooms] = useState(false)
  const [allEntries, setAllEntries] = useState<LifeMapEntry[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const gradeBand = gradeBandFromAge(activeChild?.age ?? null) as GradeBand
  const yearProgress = getYearProgress(allEntries, gradeBand)

  const playerName = activeChild?.display_name ?? guestSession?.displayName ?? 'Explorer'
  const isGuest = !activeChild && !!guestSession

  useEffect(() => {
    if (activeChild) {
      supabase.from('aw_season_pass').select('claimed_tiers').eq('student_id', activeChild.id).single()
        .then(({ data }) => { if (data) setClaimedTiers(data.claimed_tiers ?? []) })
    }
  }, [activeChild])

  useEffect(() => {
    if (activeChild) {
      getLifeMap(activeChild.id).then(setAllEntries)
    }
  }, [activeChild])

  async function saveAvatar(avatar: AvatarData) {
    setAvatarData(avatar)
    if (activeChild) {
      await supabase.from('aw_student_profiles')
        .update({ avatar_data: avatar as unknown as Record<string, unknown> }).eq('id', activeChild.id)
    } else if (guestSession) {
      localStorage.setItem('adeline_guest', JSON.stringify({ ...guestSession, avatarData: avatar }))
    }
    setScreen('chat')
  }

  async function addXP(amount: number) {
    const newXP = localXP + amount
    setLocalXP(newXP)
    if (activeChild) {
      await supabase.from('aw_student_profiles').update({ xp: newXP }).eq('id', activeChild.id)
    }
  }

  async function addCoins(amount: number) {
    const newCoins = localCoins + amount
    setLocalCoins(newCoins)
    if (activeChild) {
      await supabase.from('aw_student_profiles').update({ ade_coins: newCoins }).eq('id', activeChild.id)
    }
  }

  function handleLifeMapEntry(entry: LifeMapEntry) {
    setLifeMapEntries(prev => [entry, ...prev])
    setAllEntries(prev => [entry, ...prev])
  }

  async function handleRoomMissionComplete(description: string, tracks: Track[], xp: number, coins: number) {
    addXP(xp)
    addCoins(coins)
    if (activeChild) {
      const entry = await logActivity(activeChild.id, description, tracks, xp, coins, 'room_mission')
      if (entry) handleLifeMapEntry(entry)
    }
  }

  async function claimSeasonTier(tier: number, coinsToAdd: number) {
    const newClaimed = [...claimedTiers, tier]
    setClaimedTiers(newClaimed)
    if (coinsToAdd > 0) addCoins(coinsToAdd)
    if (activeChild) {
      await supabase.from('aw_season_pass')
        .upsert({ student_id: activeChild.id, claimed_tiers: newClaimed }, { onConflict: 'student_id' })
    }
  }

  const enterRoom = useCallback((roomId: RoomId, mode: 'quiz' | 'mission' = 'mission') => {
    setCurrentRoom(roomId)
    setRoomMode(mode)
    setScreen('room')
    setShowRooms(false)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const hudPlayer = activeChild ? { ...activeChild, xp: localXP, ade_coins: localCoins } : null
  const hudGuest = guestSession ? { ...guestSession, xp: localXP, adeCoins: localCoins } : null

  // ── Avatar Builder ──
  if (screen === 'avatar_builder') {
    return (
      <AvatarBuilder
        initialAvatar={storedAvatar ?? guestAvatar ?? undefined}
        playerName={playerName}
        onSave={saveAvatar}
      />
    )
  }

  // ── Room view ──
  if (screen === 'room' && currentRoom) {
    const config = ROOM_CONFIG[currentRoom]
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <GameHUD
          player={hudPlayer}
          guestSession={hudGuest}
          avatarData={avatarData}
          roomLabel={`${config.emoji} ${config.label}`}
          onExitRoom={() => { setCurrentRoom(null); setScreen('chat') }}
          onSignOut={handleSignOut}
        />
        <div className="w-full h-full pt-16">
          {roomMode === 'mission' ? (
            <RoomMission
              roomId={currentRoom}
              roomLabel={config.label}
              roomEmoji={config.emoji}
              roomTracks={config.tracks}
              playerName={playerName}
              systemContext={config.context}
              onComplete={handleRoomMissionComplete}
              onBack={() => { setCurrentRoom(null); setScreen('chat') }}
            />
          ) : (
            <>
              {currentRoom === 'math_mines'     && <MathMines     playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />}
              {currentRoom === 'story_forest'   && <StoryForest   playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />}
              {currentRoom === 'science_lab'    && <ScienceLab    playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />}
              {currentRoom === 'homestead_farm' && <HomesteadFarm playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />}
              {currentRoom === 'truth_archive'  && <TruthArchive  playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Hub World (2D exploration) ──
  if (screen === 'hub') {
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <GameHUD
          player={hudPlayer}
          guestSession={hudGuest}
          avatarData={avatarData}
          onExitRoom={() => setScreen('chat')}
          onSignOut={handleSignOut}
        />
        <div className="w-full h-full pt-16">
          <HubWorld
            avatarData={avatarData}
            playerName={playerName}
            onEnterRoom={(id) => enterRoom(id, 'mission')}
            onChatAdeline={() => setScreen('chat')}
          />
        </div>
      </div>
    )
  }

  // ── Main Chat Screen ──
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-amber-50/30">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-amber-100 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400">
            <img src="/adeline_portrait.png" alt="Adeline" className="w-full h-full object-cover"
              onError={e => { e.currentTarget.style.display = 'none' }} />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Adeline</p>
            <p className="text-xs text-amber-600">Learning Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 bg-slate-100 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-amber-700">{localXP} XP</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-bold text-amber-700">🪙 {localCoins}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-500">Year</span>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${yearProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-700">{yearProgress}%</span>
          </div>

          <button onClick={() => setOverlay('life_map')}
            className="px-3 py-1.5 text-xs font-semibold bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-xl transition-all">
            🗺️ Life Map
          </button>
          <button onClick={() => setOverlay('season_pass')}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl transition-all">
            🌟 Pass
          </button>
          <button onClick={() => setOverlay('graduation')}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-all">
            🎓 Path
          </button>
          <button onClick={() => setOverlay('portfolio')}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-all">
            📁 Portfolio
          </button>
          <button onClick={() => setScreen('hub')}
            className="px-3 py-1.5 text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-all">
            🏘️ Hub
          </button>
          {parentAccount && (
            <button onClick={() => navigate('/parent-dashboard')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all">
              👪
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdelineChat
            studentId={activeChild?.id ?? null}
            playerName={playerName}
            currentXP={localXP}
            onXpEarned={addXP}
            onCoinsEarned={addCoins}
            onLifeMapEntry={handleLifeMapEntry}
          />
        </div>

        {/* Right panel — desktop: mini world + rooms */}
        <div className="hidden lg:flex flex-col w-64 bg-white border-l border-amber-100 shrink-0">
          {/* Mini world with avatar */}
          <div className="h-52 p-2 border-b border-amber-100">
            <MiniWorld
              avatarData={avatarData}
              playerName={playerName}
              onEnterRoom={(id) => enterRoom(id, 'mission')}
            />
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-y-auto p-3 gap-2 flex flex-col">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-1">Enter a Room</p>
            {(Object.entries(ROOM_CONFIG) as [RoomId, typeof ROOM_CONFIG[RoomId]][]).map(([id, cfg]) => (
              <div key={id} className="rounded-xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => enterRoom(id, 'mission')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-amber-50 transition-all text-left"
                >
                  <span className="text-xl">{cfg.emoji}</span>
                  <span className="text-sm font-semibold text-slate-700">{cfg.label}</span>
                </button>
                <button
                  onClick={() => enterRoom(id, 'quiz')}
                  className="w-full px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-t border-slate-100 transition-all text-left"
                >
                  Quick quiz →
                </button>
              </div>
            ))}

            <div className="mt-auto pt-2 border-t border-slate-100">
              <button
                onClick={handleSignOut}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 rounded-lg hover:bg-slate-50 transition-all"
              >
                {isGuest ? 'Leave Game' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile room launcher */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <button
          onClick={() => setShowRooms(!showRooms)}
          className="w-14 h-14 bg-amber-500 hover:bg-amber-400 text-white rounded-full shadow-xl text-2xl flex items-center justify-center transition-all"
        >
          {showRooms ? '✕' : '🏫'}
        </button>
      </div>

      {showRooms && (
        <div className="lg:hidden fixed bottom-36 right-4 z-30 bg-white rounded-2xl shadow-xl border border-amber-100 p-3 w-52 space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">Enter a Room</p>
          {(Object.entries(ROOM_CONFIG) as [RoomId, typeof ROOM_CONFIG[RoomId]][]).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => enterRoom(id, 'mission')}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-amber-50 rounded-xl transition-all text-left"
            >
              <span className="text-xl">{cfg.emoji}</span>
              <span className="text-sm font-semibold text-slate-700">{cfg.label}</span>
            </button>
          ))}
        </div>
      )}

      {isGuest && (
        <div className="lg:hidden fixed bottom-4 left-4 right-20 bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-lg">
          💾 Guest — progress not saved.{' '}
          <button onClick={handleSignOut} className="underline">Create account</button>
        </div>
      )}

      {overlay === 'life_map' && (
        <LifeMap
          studentId={activeChild?.id ?? null}
          localEntries={lifeMapEntries}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'season_pass' && (
        <SeasonPass
          currentXP={localXP}
          claimedTiers={claimedTiers}
          onClaimTier={claimSeasonTier}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'graduation' && (
        <GraduationTracker
          entries={allEntries}
          gradeBand={gradeBand}
          studentName={playerName}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === 'portfolio' && (
        <Portfolio
          entries={allEntries}
          studentName={playerName}
          gradeBand={gradeBand}
          onClose={() => setOverlay(null)}
          onExport={() => { setOverlay(null); setShowTranscript(true) }}
        />
      )}
      {showTranscript && (
        <Transcript
          entries={allEntries}
          studentName={playerName}
          gradeBand={gradeBand}
          parentName={parentAccount?.display_name ?? 'Parent'}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </div>
  )
}
