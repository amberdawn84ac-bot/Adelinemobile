import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AvatarData, RoomId, DEFAULT_AVATAR, LifeMapEntry, Track } from '../types/game'
import AvatarBuilder from '../components/avatar/AvatarBuilder'
import GameHUD from '../components/hud/GameHUD'
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
import GraduationTracker from '../components/graduation/GraduationTracker'
import Portfolio from '../components/portfolio/Portfolio'
import Transcript from '../components/transcript/Transcript'
import { gradeBandFromAge } from '../lib/academicEngine'
import { GradeBand } from '../types/game'

type GameScreen = 'avatar_builder' | 'hub' | 'room'
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

  const [screen, setScreen] = useState<GameScreen>(hasAvatar ? 'hub' : 'avatar_builder')
  const [avatarData, setAvatarData] = useState<AvatarData>(storedAvatar ?? guestAvatar ?? DEFAULT_AVATAR)
  const [currentRoom, setCurrentRoom] = useState<RoomId | null>(null)
  const [roomMode, setRoomMode] = useState<'quiz' | 'mission'>('mission')
  const [localXP, setLocalXP] = useState(activeChild?.xp ?? guestSession?.xp ?? 0)
  const [localCoins, setLocalCoins] = useState(activeChild?.ade_coins ?? guestSession?.adeCoins ?? 0)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [lifeMapEntries, setLifeMapEntries] = useState<LifeMapEntry[]>([])
  const [claimedTiers, setClaimedTiers] = useState<number[]>([])
  const [allEntries, setAllEntries] = useState<LifeMapEntry[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const gradeBand = gradeBandFromAge(activeChild?.age ?? null) as GradeBand

  const playerName = activeChild?.display_name ?? guestSession?.displayName ?? 'Explorer'

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
    setScreen('hub')
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
          onExitRoom={() => { setCurrentRoom(null); setScreen('hub') }}
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
              onBack={() => { setCurrentRoom(null); setScreen('hub') }}
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

  // ── Hub World (2D exploration) — the main game screen ──
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <GameHUD
        player={hudPlayer}
        guestSession={hudGuest}
        avatarData={avatarData}
        onSignOut={handleSignOut}
      />
      {/* Overlay launcher buttons */}
      <div className="fixed top-16 right-3 z-40 flex flex-col gap-1.5 pointer-events-auto">
        <button onClick={() => setOverlay('life_map')}
          className="bg-violet-600/90 hover:bg-violet-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          🗺️ Life Map
        </button>
        <button onClick={() => setOverlay('season_pass')}
          className="bg-amber-600/90 hover:bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          🌟 Pass
        </button>
        <button onClick={() => setOverlay('graduation')}
          className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          🎓 Path
        </button>
        <button onClick={() => setOverlay('portfolio')}
          className="bg-blue-600/90 hover:bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          📁 Portfolio
        </button>
        {parentAccount && (
          <button onClick={() => navigate('/parent-dashboard')}
            className="bg-slate-600/90 hover:bg-slate-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
            👪 Parent
          </button>
        )}
      </div>
      <div className="w-full h-full pt-16">
        <HubWorld
          avatarData={avatarData}
          playerName={playerName}
          studentId={activeChild?.id ?? null}
          currentXP={localXP}
          onEnterRoom={(id) => enterRoom(id, 'mission')}
          onXpEarned={addXP}
          onCoinsEarned={addCoins}
          onLifeMapEntry={handleLifeMapEntry}
        />
      </div>

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
