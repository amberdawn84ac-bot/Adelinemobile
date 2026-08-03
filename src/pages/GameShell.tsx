import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AvatarData, DEFAULT_AVATAR, LifeMapEntry, Track, ActivityType, BuildingId, GradeBand, TOWN_BUILDINGS } from '../types/game'
import AvatarBuilder from '../components/avatar/AvatarBuilder'
import GameHUD from '../components/hud/GameHUD'
import HubWorld from '../components/world/HubWorld'
import LifeMap from '../components/life-map/LifeMap'
import SeasonPass from '../components/season-pass/SeasonPass'
import RoomMission from '../components/rooms/RoomMission'
import AdelineKitchen from './AdelineKitchen'
import BrainBattle from '../components/game/BrainBattle'
import { supabase } from '../lib/supabase'
import { logActivity, getLifeMap } from '../lib/lifeMapService'
import GraduationTracker from '../components/graduation/GraduationTracker'
import Portfolio from '../components/portfolio/Portfolio'
import Transcript from '../components/transcript/Transcript'
import { gradeBandFromAge } from '../lib/academicEngine'

type GameScreen = 'avatar_builder' | 'hub' | 'mission' | 'brain_battle' | 'kitchen'
type Overlay = 'life_map' | 'season_pass' | 'graduation' | 'portfolio' | null

const BUILDING_META: Record<BuildingId, { label: string; emoji: string }> = {
  adelines_kitchen:    { label: "Adeline's Kitchen", emoji: '🏡' },
  the_library:         { label: 'The Library',        emoji: '📚' },
  the_arena:           { label: 'The Arena',          emoji: '⚔️' },
  the_makers_lab:      { label: "The Maker's Lab",    emoji: '🔧' },
  the_creek_and_woods: { label: 'The Creek & Woods',  emoji: '🌿' },
  the_market:          { label: 'The Market',         emoji: '🛒' },
  the_chapel:          { label: 'The Chapel',         emoji: '✝️' },
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
  const [currentBuilding, setCurrentBuilding] = useState<BuildingId | null>(null)
  const [activityMode, setActivityMode] = useState<ActivityType>('explore')
  const [activityTrack, setActivityTrack] = useState<Track | null>(null)
  const [activityTopic, setActivityTopic] = useState<string | null>(null)
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
    if (activeChild) getLifeMap(activeChild.id).then(setAllEntries)
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

  async function handleMissionComplete(description: string, tracks: Track[], xp: number, coins: number) {
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

  const enterBuilding = useCallback((
    buildingId: BuildingId,
    mode: ActivityType,
    track: Track | null,
    topic: string | null
  ) => {
    setCurrentBuilding(buildingId)
    setActivityMode(mode)
    setActivityTrack(track)
    setActivityTopic(topic)
    setScreen(mode === 'mini_game' ? 'brain_battle' : 'mission')
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function exitToHub() {
    setCurrentBuilding(null)
    setScreen('hub')
  }

  const buildingMeta = currentBuilding ? BUILDING_META[currentBuilding] : null

  // Resolve track: use brain-provided track, or fall back to first track from building config
  const buildingFallbackTracks: Track[] = currentBuilding
    ? (TOWN_BUILDINGS.find(b => b.id === currentBuilding)?.fallbackMissions[0]?.tracks ?? ['ENGLISH_LITERATURE'])
    : ['ENGLISH_LITERATURE']
  const resolvedTrack: Track = activityTrack ?? buildingFallbackTracks[0]

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

  // ── Adeline's Kitchen ──
  if (screen === 'kitchen') {
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <GameHUD
          player={hudPlayer}
          guestSession={hudGuest}
          avatarData={avatarData}
          roomLabel="🏡 Adeline's Kitchen"
          onExitRoom={exitToHub}
          onSignOut={handleSignOut}
        />
        <div className="w-full h-full pt-16">
          <AdelineKitchen
            studentId={activeChild?.id ?? null}
            playerName={playerName}
            gradeBand={gradeBand}
            onBack={exitToHub}
          />
        </div>
      </div>
    )
  }

  // ── Brain Battle mini-game ──
  if (screen === 'brain_battle' && currentBuilding) {
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <div className="w-full h-full">
          <BrainBattle
            studentId={activeChild?.id ?? null}
            track={resolvedTrack}
            gradeBand={gradeBand}
            playerName={playerName}
            onComplete={(xp, coins) => {
              addXP(xp)
              addCoins(coins)
              exitToHub()
            }}
            onBack={exitToHub}
          />
        </div>
      </div>
    )
  }

  // ── Mission view ──
  if (screen === 'mission' && currentBuilding && buildingMeta) {
    return (
      <div className="w-screen h-screen overflow-hidden relative">
        <GameHUD
          player={hudPlayer}
          guestSession={hudGuest}
          avatarData={avatarData}
          roomLabel={`${buildingMeta.emoji} ${buildingMeta.label}`}
          onExitRoom={exitToHub}
          onSignOut={handleSignOut}
        />
        <div className="w-full h-full pt-16">
          <RoomMission
            roomId={currentBuilding}
            roomLabel={buildingMeta.label}
            roomEmoji={buildingMeta.emoji}
            roomTracks={[resolvedTrack]}
            playerName={playerName}
            systemContext={activityTopic ?? `${activityMode} activity in ${buildingMeta.label}`}
            studentId={activeChild?.id ?? null}
            gradeBand={gradeBand}
            onComplete={handleMissionComplete}
            onBack={exitToHub}
          />
        </div>
      </div>
    )
  }

  // ── Hub World ──
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <GameHUD
        player={hudPlayer}
        guestSession={hudGuest}
        avatarData={avatarData}
        onSignOut={handleSignOut}
      />
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
          onEnterBuilding={enterBuilding}
          onEnterKitchen={() => setScreen('kitchen')}
          onXpEarned={addXP}
          onCoinsEarned={addCoins}
          onLifeMapEntry={handleLifeMapEntry}
        />
      </div>

      {overlay === 'life_map' && (
        <LifeMap studentId={activeChild?.id ?? null} localEntries={lifeMapEntries} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'season_pass' && (
        <SeasonPass currentXP={localXP} claimedTiers={claimedTiers} onClaimTier={claimSeasonTier} onClose={() => setOverlay(null)} />
      )}
      {overlay === 'graduation' && (
        <GraduationTracker entries={allEntries} gradeBand={gradeBand} studentName={playerName} onClose={() => setOverlay(null)} />
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
