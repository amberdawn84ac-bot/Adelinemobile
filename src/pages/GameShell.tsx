import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AvatarData, DEFAULT_AVATAR, LifeMapEntry, Track, ActivityType, BuildingId, GradeBand, TOWN_BUILDINGS, STORM_MISSIONS } from '../types/game'
import AvatarBuilder from '../components/avatar/AvatarBuilder'
import GameHUD from '../components/hud/GameHUD'
import HubWorld from '../components/world/HubWorld'
import LifeMap from '../components/life-map/LifeMap'
import SeasonPass from '../components/season-pass/SeasonPass'
import RoomMission from '../components/rooms/RoomMission'
import AdelineKitchen from './AdelineKitchen'
import BrainBattle from '../components/game/BrainBattle'
import { updateStudentProfile, patchXP, patchCoins, getSeasonPass, patchSeasonPass, createTown, joinTown, getTown, Town, getTownStorm, postTownStormPrep, StormStatus } from '../lib/brainClient'
import { logActivity, getLifeMap } from '../lib/lifeMapService'
import GraduationTracker from '../components/graduation/GraduationTracker'
import Portfolio from '../components/portfolio/Portfolio'
import Transcript from '../components/transcript/Transcript'

type GameScreen = 'avatar_builder' | 'hub' | 'mission' | 'brain_battle' | 'kitchen'
type Overlay = 'life_map' | 'season_pass' | 'graduation' | 'portfolio' | 'settings' | null

const BUILDING_META: Record<BuildingId, { label: string; emoji: string }> = {
  adelines_kitchen:    { label: "Adeline's Kitchen", emoji: '' },
  the_library:         { label: 'The Library',        emoji: '' },
  the_arena:           { label: 'The Old Hall',       emoji: '' },
  the_makers_lab:      { label: "The Workshop",       emoji: '' },
  the_creek_and_woods: { label: 'Creek & Woods',      emoji: '' },
  the_market:          { label: 'Main Street Market', emoji: '' },
  the_chapel:          { label: 'The Chapel',         emoji: '' },
}

function parseAvatar(data: Record<string, unknown>): AvatarData | null {
  if (!data || !data.character) return null
  return data as unknown as AvatarData
}

export default function GameShell() {
  const { user: activeChild, guestSession, signOut, refreshUser } = useAuth()
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
  const [journalOpen, setJournalOpen] = useState(false)
  const [lifeMapEntries, setLifeMapEntries] = useState<LifeMapEntry[]>([])
  const [claimedTiers, setClaimedTiers] = useState<number[]>([])
  const [allEntries, setAllEntries] = useState<LifeMapEntry[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const [town, setTown] = useState<Town | null>(null)
  const [townFormMode, setTownFormMode] = useState<'create' | 'join'>('create')
  const [townFormValue, setTownFormValue] = useState('')
  const [townFormError, setTownFormError] = useState('')
  const [townFormLoading, setTownFormLoading] = useState(false)
  const [townLoadFailed, setTownLoadFailed] = useState(false)
  const [stormStatus, setStormStatus] = useState<StormStatus | null>(null)
  const gradeBand = (activeChild?.grade_level ?? 'K-2') as GradeBand

  const playerName = activeChild?.display_name ?? guestSession?.displayName ?? 'Explorer'

  useEffect(() => {
    if (activeChild) getSeasonPass(activeChild.id).then(setClaimedTiers)
  }, [activeChild])

  useEffect(() => {
    if (activeChild) getLifeMap(activeChild.id).then(setAllEntries)
  }, [activeChild])

  useEffect(() => {
    if (overlay === 'settings' && activeChild?.town_id && !town && !townLoadFailed) {
      getTown(activeChild.town_id).then(result => {
        if (result) setTown(result)
        else setTownLoadFailed(true)
      })
    }
  }, [overlay, activeChild, town, townLoadFailed])

  useEffect(() => {
    setTown(null)
    setTownLoadFailed(false)
  }, [activeChild?.id])

  useEffect(() => {
    if (activeChild?.town_id) getTownStorm(activeChild.town_id).then(setStormStatus)
  }, [activeChild?.town_id])

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

  async function handleTownFormSubmit() {
    setTownFormError('')
    setTownFormLoading(true)
    try {
      const result = townFormMode === 'create'
        ? await createTown(townFormValue.trim())
        : await joinTown(townFormValue.trim().toUpperCase())
      if (!result) {
        setTownFormError(townFormMode === 'create' ? 'Could not create town. Try again.' : "That code didn't work. Check it and try again.")
      } else {
        setTown(result)
        setTownFormValue('')
        await refreshUser()
      }
    } finally {
      setTownFormLoading(false)
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
    if (activeStormMission && activeChild?.town_id) postTownStormPrep(activeChild.town_id)
  }

  async function claimSeasonTier(tier: number, coinsToAdd: number) {
    const newClaimed = [...claimedTiers, tier]
    setClaimedTiers(newClaimed)
    if (coinsToAdd > 0) addCoins(coinsToAdd)
    if (activeChild) await patchSeasonPass(activeChild.id, newClaimed)
  }

  const enterBuilding = useCallback((buildingId: BuildingId, mode: ActivityType, track: Track | null, topic: string | null) => {
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

  function openJournalPage(page: Exclude<Overlay, null>) {
    setJournalOpen(false)
    setOverlay(page)
  }

  const buildingMeta = currentBuilding ? BUILDING_META[currentBuilding] : null
  const buildingFallbackTracks: Track[] = currentBuilding
    ? (TOWN_BUILDINGS.find(b => b.id === currentBuilding)?.fallbackMissions[0]?.tracks ?? ['ENGLISH_LITERATURE'])
    : ['ENGLISH_LITERATURE']
  const resolvedTrack: Track = activityTrack ?? buildingFallbackTracks[0]
  const activeStormMission = stormStatus?.phase === 'warning' && currentBuilding ? STORM_MISSIONS[currentBuilding]?.[0] : undefined
  const hudPlayer = activeChild ? { ...activeChild, xp: localXP, ade_coins: localCoins } : null
  const hudGuest = guestSession ? { ...guestSession, xp: localXP, adeCoins: localCoins } : null

  if (screen === 'avatar_builder') {
    return <AvatarBuilder initialAvatar={storedAvatar ?? guestAvatar ?? undefined} playerName={playerName} onSave={saveAvatar} />
  }

  if (screen === 'kitchen') {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <GameHUD player={hudPlayer} guestSession={hudGuest} avatarData={avatarData} roomLabel="Adeline's Kitchen" onExitRoom={exitToHub} onSignOut={handleSignOut} />
        <div className="h-full w-full pt-16">
          <AdelineKitchen studentId={activeChild?.id ?? null} playerName={playerName} gradeBand={gradeBand} onBack={exitToHub} />
        </div>
      </div>
    )
  }

  if (screen === 'brain_battle' && currentBuilding) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <BrainBattle
          studentId={activeChild?.id ?? null}
          track={resolvedTrack}
          gradeBand={gradeBand}
          playerName={playerName}
          onComplete={(xp, coins) => { addXP(xp); addCoins(coins); exitToHub() }}
          onBack={exitToHub}
        />
      </div>
    )
  }

  if (screen === 'mission' && currentBuilding && buildingMeta) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <div className="h-full w-full">
          <RoomMission
            roomId={currentBuilding}
            roomLabel={buildingMeta.label}
            roomEmoji=""
            roomTracks={[resolvedTrack]}
            playerName={playerName}
            systemContext={activityTopic ?? `${activityMode} activity in ${buildingMeta.label}`}
            studentId={activeChild?.id ?? null}
            gradeBand={gradeBand}
            stormMission={activeStormMission}
            onComplete={handleMissionComplete}
            onBack={exitToHub}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <GameHUD player={hudPlayer} guestSession={hudGuest} avatarData={avatarData} onSignOut={handleSignOut} />

      <div className="h-full w-full pt-16">
        {stormStatus?.phase === 'warning' && (
          <div className="pointer-events-none fixed left-1/2 top-[66px] z-30 -translate-x-1/2 rotate-[-1deg] rounded-sm border border-[#3a3128]/15 bg-[#efe7d4]/85 px-4 py-2 font-serif text-[10px] italic tracking-wide text-[#51473c] shadow-md backdrop-blur">
            barometer falling · {stormStatus.days_until_hit} day{stormStatus.days_until_hit === 1 ? '' : 's'}
          </div>
        )}
        {stormStatus?.phase === 'hit' && (
          <div className="pointer-events-none fixed inset-0 z-20 bg-[#34434a]/12 backdrop-brightness-[.86]" />
        )}

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

      <button
        onClick={() => setJournalOpen(v => !v)}
        className="fixed right-4 top-[74px] z-40 rotate-[1deg] rounded-[6px_10px_7px_9px] border border-[#382f27]/25 bg-[#eadfc8]/95 px-3 py-2 font-serif text-[11px] text-[#3d352c] shadow-lg"
      >
        journal
      </button>

      {journalOpen && (
        <div className="fixed right-4 top-[114px] z-40 w-44 rotate-[-.5deg] rounded-[14px_9px_16px_8px] border border-[#3a3027]/25 bg-[#f3ead6]/95 p-2 shadow-2xl backdrop-blur">
          <p className="px-2 pb-2 pt-1 font-serif text-[9px] uppercase tracking-[.2em] text-[#746758]">inside cover</p>
          <JournalLink label="field notes" onClick={() => openJournalPage('life_map')} />
          <JournalLink label="keepsakes" onClick={() => openJournalPage('season_pass')} />
          <JournalLink label="long road" onClick={() => openJournalPage('graduation')} />
          <JournalLink label="things I made" onClick={() => openJournalPage('portfolio')} />
          <div className="my-1 h-px bg-[#44392f]/15" />
          <JournalLink label="town & account" onClick={() => openJournalPage('settings')} />
        </div>
      )}

      {overlay === 'life_map' && <LifeMap studentId={activeChild?.id ?? null} localEntries={lifeMapEntries} onClose={() => setOverlay(null)} />}
      {overlay === 'season_pass' && <SeasonPass currentXP={localXP} claimedTiers={claimedTiers} onClaimTier={claimSeasonTier} onClose={() => setOverlay(null)} />}
      {overlay === 'graduation' && <GraduationTracker entries={allEntries} gradeBand={gradeBand} studentName={playerName} onClose={() => setOverlay(null)} />}

      {overlay === 'settings' && activeChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241f1a]/45 p-6" onClick={() => { setOverlay(null); setTownLoadFailed(false) }}>
          <div className="w-full max-w-sm space-y-4 rounded-[24px_18px_28px_20px] border border-[#42372e]/20 bg-[#f3ead6] p-6 font-serif text-[#3b332b] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg">Town & account</h3>
            {activeChild.parent_id ? (
              <p className="text-sm text-[#675b4e]">Linked to {activeChild.parent_display_name ?? 'a parent'}.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#675b4e]">Parent link code</p>
                <p className="rounded-xl bg-[#e7d9bd] py-3 text-center font-mono text-2xl font-bold tracking-widest text-[#765128]">{activeChild.link_code}</p>
                <p className="text-xs text-[#867764]">A parent can use this code on Dear Adeline to link the accounts.</p>
              </div>
            )}

            <div className="space-y-2 border-t border-[#44392f]/15 pt-4">
              <p className="text-sm font-semibold">Your town</p>
              {activeChild.town_id && town ? (
                <div className="space-y-1 text-sm text-[#675b4e]">
                  <p>{town.name}</p>
                  <p className="text-xs">{town.members.length} member{town.members.length === 1 ? '' : 's'} · treasury {town.treasury}</p>
                  <p className="font-mono text-xs">join code {town.join_code}</p>
                </div>
              ) : activeChild.town_id ? (
                townLoadFailed ? <p className="text-xs text-[#8b4038]">Couldn’t load the town.</p> : <p className="text-xs text-[#867764]">Looking up the town…</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => { setTownFormMode('create'); setTownFormError(''); setTownFormValue('') }} className={`rounded-full px-3 py-1.5 ${townFormMode === 'create' ? 'bg-[#d8c49d] text-[#3f352b]' : 'text-[#8a7b68]'}`}>start one</button>
                    <button onClick={() => { setTownFormMode('join'); setTownFormError(''); setTownFormValue('') }} className={`rounded-full px-3 py-1.5 ${townFormMode === 'join' ? 'bg-[#d8c49d] text-[#3f352b]' : 'text-[#8a7b68]'}`}>join one</button>
                  </div>
                  <input
                    type="text"
                    value={townFormValue}
                    onChange={e => setTownFormValue(townFormMode === 'join' ? e.target.value.toUpperCase().slice(0, 6) : e.target.value)}
                    placeholder={townFormMode === 'create' ? 'town name' : '6-digit code'}
                    className="w-full rounded-lg border border-[#44392f]/20 bg-[#fff9eb]/60 px-3 py-2 text-sm outline-none"
                    maxLength={townFormMode === 'join' ? 6 : 100}
                  />
                  {townFormError && <p className="text-xs text-[#8b4038]">{townFormError}</p>}
                  <button onClick={handleTownFormSubmit} disabled={townFormLoading || !townFormValue.trim()} className="w-full rounded-full bg-[#315d58] py-2 text-sm text-[#fff7e9] disabled:opacity-40">
                    {townFormLoading ? 'one moment…' : townFormMode === 'create' ? 'start town' : 'join town'}
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleSignOut} className="w-full border-t border-[#44392f]/15 pt-4 text-sm text-[#756858]">sign out</button>
            <button onClick={() => { setOverlay(null); setTownLoadFailed(false) }} className="w-full rounded-full bg-[#e2d5bc] py-2.5 text-sm">close</button>
          </div>
        </div>
      )}

      {overlay === 'portfolio' && (
        <Portfolio entries={allEntries} studentName={playerName} gradeBand={gradeBand} onClose={() => setOverlay(null)} onExport={() => { setOverlay(null); setShowTranscript(true) }} />
      )}
      {showTranscript && (
        <Transcript entries={allEntries} studentName={playerName} gradeBand={gradeBand} parentName={activeChild?.parent_display_name ?? 'Parent'} onClose={() => setShowTranscript(false)} />
      )}
    </div>
  )
}

function JournalLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-lg px-3 py-2 text-left font-serif text-[12px] text-[#453c32] transition hover:bg-[#dfd1b5]/70">
      {label}
    </button>
  )
}
