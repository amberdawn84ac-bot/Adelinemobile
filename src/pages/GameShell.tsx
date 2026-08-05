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
import { updateStudentProfile, patchXP, patchCoins, getSeasonPass, patchSeasonPass } from '../lib/brainClient'
import { logActivity, getLifeMap } from '../lib/lifeMapService'
import GraduationTracker from '../components/graduation/GraduationTracker'
import Portfolio from '../components/portfolio/Portfolio'
import Transcript from '../components/transcript/Transcript'

type GameScreen = 'avatar_builder' | 'hub' | 'mission' | 'brain_battle' | 'kitchen'
type Overlay = 'life_map' | 'season_pass' | 'graduation' | 'portfolio' | 'settings' | null

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
  const { user: activeChild, guestSession, signOut } = useAuth()
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
  const gradeBand = (activeChild?.grade_level ?? 'K-2') as GradeBand

  const playerName = activeChild?.display_name ?? guestSession?.displayName ?? 'Explorer'

  useEffect(() => {
    if (activeChild) {
      getSeasonPass(activeChild.id).then(setClaimedTiers)
    }
  }, [activeChild])

  useEffect(() => {
    if (activeChild) getLifeMap(activeChild.id).then(setAllEntries)
  }, [activeChild])

  async function saveAvatar(avatar: AvatarData) {
    setAvatarData(avatar)
    if (activeChild) {
      await updateStudentProfile(activeChild.id, { avatar_data: avatar as unknown as Record<string, unknown> })
    } else if (guestSession) {
      localStorage.setItem('adeline_guest', JSON.stringify({ ...guestSession, avatarData: avatar }))
    }
    setScreen('hub')
  }

  function addXP(amount: number) {
    setLocalXP(prev => prev + amount)
    if (activeChild) patchXP(activeChild.id, amount)
  }

  function addCoins(amount: number) {
    setLocalCoins(prev => prev + amount)
    if (activeChild) patchCoins(activeChild.id, amount)
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
      await patchSeasonPass(activeChild.id, newClaimed)
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
        <button onClick={() => setOverlay('settings')}
          className="bg-slate-600/90 hover:bg-slate-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow backdrop-blur transition-all">
          ⚙️ Settings
        </button>
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
      {overlay === 'settings' && activeChild && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={() => setOverlay(null)}>
          <div className="bg-white rounded-3xl shadow-xl p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-serif text-slate-800">Settings</h3>
            {activeChild.parent_id ? (
              <p className="text-sm text-slate-600">Linked to {activeChild.parent_display_name ?? 'a parent'}.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Link with a parent</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-amber-700 text-center bg-amber-50 rounded-xl py-3">
                  {activeChild.link_code}
                </p>
                <p className="text-xs text-slate-400">Give this code to your parent to link accounts on the desktop app.</p>
              </div>
            )}
            <button onClick={signOut} className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 border-t border-slate-100 pt-4">
              Sign Out
            </button>
            <button onClick={() => setOverlay(null)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl">
              Close
            </button>
          </div>
        </div>
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
          parentName={activeChild?.parent_display_name ?? 'Parent'}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </div>
  )
}
