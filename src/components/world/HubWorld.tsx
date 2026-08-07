import { useState, useEffect, useCallback, useRef } from 'react'
import { AvatarData, PlayerState, TOWN_BUILDINGS, BuildingId, LifeMapEntry, Track, ActivityType } from '../../types/game'
import AvatarRenderer from '../avatar/AvatarRenderer'
import TownBuilding from './TownBuilding'
import ActivityPicker from '../game/ActivityPicker'
import { TownBuilding as TownBuildingType } from '../../types/game'

const MOVE_SPEED = 1.15
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

const littleTrees = [
  {x:3,y:36,s:.75},{x:8,y:47,s:1},{x:13,y:68,s:.8},{x:18,y:34,s:.65},
  {x:87,y:36,s:.75},{x:93,y:48,s:1.05},{x:96,y:67,s:.8},{x:82,y:72,s:.65},
  {x:28,y:31,s:.6},{x:73,y:30,s:.65},{x:5,y:82,s:.65},{x:91,y:84,s:.7}
]

const flowers = [
  {x:17,y:77,c:'#782f52'},{x:20,y:80,c:'#315b70'},{x:24,y:75,c:'#b8862b'},
  {x:76,y:79,c:'#68417d'},{x:80,y:75,c:'#286c5b'},{x:83,y:81,c:'#9c3d55'},
  {x:46,y:64,c:'#315b70'},{x:54,y:67,c:'#782f52'}
]

export default function HubWorld({
  avatarData, playerName, studentId, currentXP,
  onEnterBuilding, onEnterKitchen
}: Props) {
  const [player, setPlayer] = useState<PlayerState>({ x: 50, y: 82, facing: 'up' })
  const keysPressed = useRef<Set<string>>(new Set())
  const animFrame = useRef<number | undefined>(undefined)
  const playerRef = useRef(player)
  playerRef.current = player

  const [pickerBuilding, setPickerBuilding] = useState<TownBuildingType | null>(null)

  const movePlayer = useCallback(() => {
    setPlayer(prev => {
      let { x, y, facing } = prev
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) { y -= MOVE_SPEED; facing = 'up' }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S')) { y += MOVE_SPEED; facing = 'down' }
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || keysPressed.current.has('A')) { x -= MOVE_SPEED; facing = 'left' }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) { x += MOVE_SPEED; facing = 'right' }
      x = Math.max(4, Math.min(96, x))
      y = Math.max(19, Math.min(92, y))
      return { x, y, facing }
    })
    animFrame.current = requestAnimationFrame(movePlayer)
  }, [])

  const enterNearby = useCallback(() => {
    const p = playerRef.current
    for (const b of TOWN_BUILDINGS) {
      if (distance(p.x, p.y, b.position.x, b.position.y) < BUILDING_PROXIMITY) {
        if (b.unlockXP > currentXP) return
        if (b.id === 'adelines_kitchen') { onEnterKitchen(); return }
        setPickerBuilding(b)
        return
      }
    }
  }, [currentXP, onEnterKitchen])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysPressed.current.add(e.key)
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') enterNearby()
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
  }, [movePlayer, enterNearby])

  function nudge(dx: number, dy: number, facing: PlayerState['facing']) {
    setPlayer(prev => ({
      x: Math.max(4, Math.min(96, prev.x + dx)),
      y: Math.max(19, Math.min(92, prev.y + dy)),
      facing,
    }))
  }

  const nearbyBuilding = TOWN_BUILDINGS.find(b => distance(player.x, player.y, b.position.x, b.position.y) < BUILDING_PROXIMITY)

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#ebe3cf] text-[#2d2924] touch-none">
      {/* parchment sky */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #eee8db 0%, #d9d6c7 27%, #9caf91 48%, #73856a 72%, #5f6e59 100%)'
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.23] pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: 'radial-gradient(#3c342a 0.6px, transparent 0.7px)', backgroundSize: '5px 5px' }}
      />

      {/* distant hills, deliberately a little imperfect */}
      <div className="absolute left-[-8%] top-[26%] w-[62%] h-[29%] rounded-[50%] bg-[#718068]/75 border-t-2 border-[#2f342c]/30" style={{ transform:'rotate(3deg)' }} />
      <div className="absolute right-[-9%] top-[23%] w-[66%] h-[32%] rounded-[50%] bg-[#66765f]/80 border-t-2 border-[#2f342c]/30" style={{ transform:'rotate(-3deg)' }} />

      {/* pale moon / sun */}
      <div className="absolute top-[13%] right-[13%] w-14 h-14 rounded-full bg-[#c8952f]/75 shadow-[0_0_55px_rgba(200,149,47,.42)] border border-[#6c5529]/20" />

      {/* winding creek */}
      <div
        className="absolute left-[36%] top-[47%] w-[30%] h-[58%] bg-[#315f70]/75 border-x-2 border-[#243f49]/25 shadow-inner"
        style={{ clipPath:'polygon(45% 0,58% 8%,43% 18%,63% 29%,47% 40%,68% 53%,53% 66%,66% 80%,44% 100%,25% 100%,43% 80%,30% 67%,45% 55%,31% 41%,47% 30%,34% 18%)' }}
      />

      {/* crooked road */}
      <div
        className="absolute left-[22%] top-[42%] w-[58%] h-[55%] bg-[#c1aa83]/70 border-x border-[#5f5141]/20"
        style={{ clipPath:'polygon(43% 0,57% 0,67% 29%,59% 47%,70% 72%,79% 100%,25% 100%,37% 72%,31% 48%,38% 28%)' }}
      />

      {/* pencil trees */}
      {littleTrees.map((t,i) => (
        <div key={i} className="absolute" style={{ left:`${t.x}%`, top:`${t.y}%`, transform:`scale(${t.s})`, zIndex:5 }}>
          <div className="relative w-12 h-16 -translate-x-1/2">
            <span className="absolute left-1/2 bottom-0 w-[3px] h-9 bg-[#3d352d] -translate-x-1/2 rotate-[-2deg]" />
            <span className="absolute left-[6px] top-[11px] w-10 h-10 rounded-[48%_52%_43%_57%] border-2 border-[#2e332b]/60 bg-[#4f684e]/55 rotate-[-7deg]" />
            <span className="absolute left-[15px] top-[2px] w-8 h-10 rounded-[55%_45%_58%_42%] border-2 border-[#2e332b]/55 bg-[#61775b]/50 rotate-[9deg]" />
            <span className="absolute left-[0px] top-[23px] w-8 h-8 rounded-full border border-[#2e332b]/50 bg-[#536b51]/45" />
          </div>
        </div>
      ))}

      {/* jewel-tone wildflower sparks */}
      {flowers.map((f,i) => (
        <div key={i} className="absolute z-[7]" style={{ left:`${f.x}%`, top:`${f.y}%` }}>
          <div className="w-[2px] h-5 bg-[#394235]/70" />
          <div className="absolute -left-[5px] -top-[3px] w-3 h-3 rounded-full border border-[#302a24]/45" style={{ background:f.c, boxShadow:`0 0 10px ${f.c}55` }} />
        </div>
      ))}

      {/* tiny lanterns along the road */}
      {[{x:40,y:56},{x:61,y:58},{x:44,y:72},{x:66,y:77}].map((l,i) => (
        <div key={i} className="absolute z-[9]" style={{left:`${l.x}%`,top:`${l.y}%`}}>
          <div className="w-[2px] h-7 bg-[#40372e]" />
          <div className="absolute -left-[5px] top-0 w-3 h-4 rounded-sm border border-[#40372e] bg-[#d39b36]/85 shadow-[0_0_15px_rgba(211,155,54,.72)]" />
        </div>
      ))}

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

      {/* player */}
      <div
        className="absolute flex flex-col items-center"
        style={{ left:`${player.x}%`, top:`${player.y}%`, transform:'translate(-50%,-50%)', zIndex:30, filter:'drop-shadow(0 6px 8px rgba(35,30,23,.3))' }}
      >
        <div className="relative">
          <div className="absolute inset-1 rounded-full bg-[#e7dec8]/80 blur-md" />
          <AvatarRenderer avatar={avatarData} size={66} />
        </div>
        <p className="mt-0.5 px-2.5 py-1 rounded-full bg-[#f4eddc]/88 border border-[#352f27]/15 font-serif text-[11px] shadow-sm">{playerName}</p>
      </div>

      {/* environmental prompt, not a school prompt */}
      {nearbyBuilding && !pickerBuilding && (
        <div className="absolute left-1/2 bottom-[88px] -translate-x-1/2 z-40 pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-[#f5efdf]/92 border border-[#332d25]/20 shadow-lg text-[11px] font-serif whitespace-nowrap">
            {nearbyBuilding.unlockXP > currentXP ? 'Something keeps you from going farther.' : `${nearbyBuilding.name} is close.`}
          </div>
        </div>
      )}

      {/* mobile controls */}
      <div className="absolute left-4 bottom-4 z-40 sm:hidden w-[112px] h-[112px]">
        <button aria-label="Move up" onPointerDown={() => nudge(0,-3.4,'up')} className="absolute left-[38px] top-0 w-9 h-9 rounded-full bg-[#f5efdf]/75 border border-[#332d25]/20 shadow-md text-[#3a332b]">↑</button>
        <button aria-label="Move left" onPointerDown={() => nudge(-3.4,0,'left')} className="absolute left-0 top-[38px] w-9 h-9 rounded-full bg-[#f5efdf]/75 border border-[#332d25]/20 shadow-md text-[#3a332b]">←</button>
        <button aria-label="Move right" onPointerDown={() => nudge(3.4,0,'right')} className="absolute right-0 top-[38px] w-9 h-9 rounded-full bg-[#f5efdf]/75 border border-[#332d25]/20 shadow-md text-[#3a332b]">→</button>
        <button aria-label="Move down" onPointerDown={() => nudge(0,3.4,'down')} className="absolute left-[38px] bottom-0 w-9 h-9 rounded-full bg-[#f5efdf]/75 border border-[#332d25]/20 shadow-md text-[#3a332b]">↓</button>
      </div>

      <button
        type="button"
        onClick={enterNearby}
        disabled={!nearbyBuilding || nearbyBuilding.unlockXP > currentXP}
        className="absolute right-5 bottom-7 sm:bottom-5 z-40 w-[66px] h-[66px] rounded-full border-2 border-[#3b332a]/25 bg-[#5b3769]/90 text-[#fff8e9] font-serif text-[12px] shadow-[0_8px_24px_rgba(49,35,55,.3)] disabled:opacity-25 disabled:grayscale"
      >
        enter
      </button>

      <div className="hidden sm:block absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.15em] uppercase text-[#29251f]/55 z-30">
        WASD to wander · E to enter
      </div>

      {pickerBuilding && (
        <ActivityPicker
          building={pickerBuilding}
          studentId={studentId}
          onSelect={(mode, track, topic) => {
            const selectedBuilding = pickerBuilding
            setPickerBuilding(null)
            onEnterBuilding(selectedBuilding.id, mode, track, topic)
          }}
          onClose={() => setPickerBuilding(null)}
        />
      )}
    </div>
  )
}
