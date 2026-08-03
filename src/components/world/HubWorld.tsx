import { useState, useEffect, useCallback, useRef } from 'react'
import { AvatarData, PlayerState, TOWN_BUILDINGS, BuildingId, LifeMapEntry, Track, ActivityType } from '../../types/game'
import AvatarRenderer from '../avatar/AvatarRenderer'
import TownBuilding from './TownBuilding'
import ActivityPicker from '../game/ActivityPicker'
import AdelineGreeting from '../game/AdelineGreeting'
import ActivityConfirm, { PendingActivity } from '../chat/ActivityConfirm'
import { logActivity } from '../../lib/lifeMapService'
import { TownBuilding as TownBuildingType } from '../../types/game'

const MOVE_SPEED = 1.5
const BUILDING_PROXIMITY = 12

interface Props {
  avatarData: AvatarData
  playerName: string
  studentId: string | null
  currentXP: number
  onEnterBuilding: (buildingId: BuildingId, mode: ActivityType, track: Track | null, suggestedTopic: string | null) => void
  onEnterKitchen: () => void
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
  onLifeMapEntry: (entry: LifeMapEntry) => void
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

export default function HubWorld({
  avatarData, playerName, studentId, currentXP,
  onEnterBuilding, onEnterKitchen,
  onXpEarned, onCoinsEarned, onLifeMapEntry
}: Props) {
  const [player, setPlayer] = useState<PlayerState>({ x: 50, y: 80, facing: 'up' })
  const keysPressed = useRef<Set<string>>(new Set())
  const animFrame = useRef<number | undefined>(undefined)
  const playerRef = useRef(player)
  playerRef.current = player

  const [showGreeting, setShowGreeting] = useState(true)
  const [pickerBuilding, setPickerBuilding] = useState<TownBuildingType | null>(null)
  const [pendingActivity, setPendingActivity] = useState<PendingActivity | null>(null)

  const movePlayer = useCallback(() => {
    setPlayer(prev => {
      let { x, y, facing } = prev
      if (keysPressed.current.has('ArrowUp')    || keysPressed.current.has('w') || keysPressed.current.has('W')) { y -= MOVE_SPEED; facing = 'up' }
      if (keysPressed.current.has('ArrowDown')  || keysPressed.current.has('s') || keysPressed.current.has('S')) { y += MOVE_SPEED; facing = 'down' }
      if (keysPressed.current.has('ArrowLeft')  || keysPressed.current.has('a') || keysPressed.current.has('A')) { x -= MOVE_SPEED; facing = 'left' }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) { x += MOVE_SPEED; facing = 'right' }
      x = Math.max(3, Math.min(97, x))
      y = Math.max(15, Math.min(93, y))
      return { x, y, facing }
    })
    animFrame.current = requestAnimationFrame(movePlayer)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysPressed.current.add(e.key)
      if (e.key === 'e' || e.key === 'E') {
        if (pickerBuilding || showGreeting) return
        const p = playerRef.current
        for (const b of TOWN_BUILDINGS) {
          if (distance(p.x, p.y, b.position.x, b.position.y) < BUILDING_PROXIMITY) {
            const locked = b.unlockXP > currentXP
            if (locked) return
            if (b.id === 'adelines_kitchen') { onEnterKitchen(); return }
            setPickerBuilding(b)
            return
          }
        }
      }
      if (e.key === 'Escape') setPickerBuilding(null)
    }
    function onKeyUp(e: KeyboardEvent) { keysPressed.current.delete(e.key) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    animFrame.current = requestAnimationFrame(movePlayer)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [movePlayer, onEnterKitchen, pickerBuilding, showGreeting, currentXP])

  async function confirmActivity() {
    if (!pendingActivity) return
    onXpEarned(pendingActivity.xpReward)
    onCoinsEarned(pendingActivity.coinReward)
    if (studentId) {
      const entry = await logActivity(studentId, pendingActivity.description, pendingActivity.tracks, pendingActivity.xpReward, pendingActivity.coinReward, 'chat_log')
      if (entry) onLifeMapEntry(entry)
    }
    setPendingActivity(null)
  }

  const nearbyBuilding = TOWN_BUILDINGS.find(b =>
    distance(player.x, player.y, b.position.x, b.position.y) < BUILDING_PROXIMITY
  )

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Sky + ground */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #b8e4ff 38%, #5DBB5D 38%, #228B22 100%)' }} />

      {/* Dirt path through town */}
      <div className="absolute" style={{ left: '20%', top: '38%', width: '60%', height: '54%', background: 'rgba(210,180,140,0.55)', borderRadius: '12px' }} />

      {/* Trees */}
      {[{x:4,y:42},{x:11,y:54},{x:88,y:46},{x:94,y:58},{x:3,y:72},{x:95,y:70},{x:15,y:38},{x:84,y:40}].map((t,i) => (
        <div key={i} className="absolute" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
          <div style={{ width:28, height:36, background:'#1a6b1a', borderRadius:'50% 50% 30% 30%', marginLeft:-14 }} />
          <div style={{ width:8, height:18, background:'#5D4037', marginLeft:-4 }} />
        </div>
      ))}

      {/* Buildings */}
      {TOWN_BUILDINGS.map(building => (
        <TownBuilding
          key={building.id}
          building={building}
          isNearby={nearbyBuilding?.id === building.id}
          isLocked={building.unlockXP > currentXP}
          onEnter={() => {
            if (building.id === 'adelines_kitchen') { onEnterKitchen(); return }
            setPickerBuilding(building)
          }}
        />
      ))}

      {/* Player avatar */}
      <div
        className="absolute flex flex-col items-center transition-none"
        style={{ left: `${player.x}%`, top: `${player.y}%`, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))', zIndex: 20 }}
      >
        <AvatarRenderer avatar={avatarData} size={64} />
        <p className="text-white text-xs font-bold text-center mt-0.5 drop-shadow bg-black/40 rounded-full px-2">{playerName}</p>
      </div>

      {/* Activity confirm banner */}
      {pendingActivity && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40">
          <ActivityConfirm
            activity={pendingActivity}
            onConfirm={confirmActivity}
            onDismiss={() => setPendingActivity(null)}
          />
        </div>
      )}

      {/* Activity picker modal */}
      {pickerBuilding && (
        <ActivityPicker
          building={pickerBuilding}
          studentId={studentId}
          onSelect={(mode, track, topic) => {
            setPickerBuilding(null)
            onEnterBuilding(pickerBuilding.id, mode, track, topic)
          }}
          onClose={() => setPickerBuilding(null)}
        />
      )}

      {/* Adeline greeting on first load */}
      {showGreeting && (
        <AdelineGreeting
          studentId={studentId}
          playerName={playerName}
          gradeBand="3-5"
          onDismiss={() => setShowGreeting(false)}
        />
      )}

      {/* Controls hint */}
      {!pickerBuilding && !showGreeting && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
          WASD / Arrow keys to move · E to enter
        </div>
      )}
    </div>
  )
}
