import { useState } from 'react'
import { AvatarData, RoomId, HUB_PORTALS } from '../../types/game'
import AvatarRenderer from '../avatar/AvatarRenderer'

interface Props {
  avatarData: AvatarData
  playerName: string
  onEnterRoom: (roomId: RoomId) => void
}

const AVATAR_HOME = { x: 50, y: 72 }

const DOOR_POSITIONS: Record<RoomId, { x: number; y: number }> = {
  math_mines:     { x: 22, y: 42 },
  story_forest:   { x: 75, y: 38 },
  science_lab:    { x: 50, y: 18 },
  homestead_farm: { x: 15, y: 62 },
  truth_archive:  { x: 85, y: 62 },
}

const WALK_DURATION_MS = 600

export default function MiniWorld({ avatarData, playerName, onEnterRoom }: Props) {
  const [avatarPos, setAvatarPos] = useState(AVATAR_HOME)
  const [walking, setWalking] = useState(false)
  const [targetRoom, setTargetRoom] = useState<RoomId | null>(null)
  const [hovered, setHovered] = useState<RoomId | null>(null)

  function handleRoomClick(roomId: RoomId) {
    if (walking) return
    const dest = DOOR_POSITIONS[roomId]
    setTargetRoom(roomId)
    setWalking(true)
    setAvatarPos(dest)

    setTimeout(() => {
      setWalking(false)
      setAvatarPos(AVATAR_HOME)
      setTargetRoom(null)
      onEnterRoom(roomId)
    }, WALK_DURATION_MS + 100)
  }

  const portal = HUB_PORTALS.find(p => p.id === targetRoom)

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl select-none"
      style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #b0e0ff 35%, #5DBB5D 35%, #228B22 100%)' }}
    >
      {/* Path */}
      <div
        className="absolute rounded-lg"
        style={{ left: '25%', top: '35%', width: '50%', height: '50%', background: 'rgba(210,180,140,0.5)' }}
      />

      {/* Mini trees */}
      {[{x:5,y:45},{x:88,y:50},{x:8,y:68},{x:90,y:65}].map((t,i) => (
        <div key={i} className="absolute" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
          <div style={{ width:14, height:18, background:'#1a6b1a', borderRadius:'50% 50% 30% 30%', marginLeft:-7 }} />
          <div style={{ width:4, height:8, background:'#5D4037', marginLeft:-2 }} />
        </div>
      ))}

      {/* Hub sign */}
      <div className="absolute" style={{ left:'50%', top:'26%', transform:'translateX(-50%)' }}>
        <div className="bg-amber-800/90 text-amber-100 font-bold text-[9px] px-2 py-1 rounded-md whitespace-nowrap">
          🏘️ Hub
        </div>
      </div>

      {/* Room doors */}
      {HUB_PORTALS.map(portal => {
        const pos = DOOR_POSITIONS[portal.id]
        const isHovered = hovered === portal.id
        const isTarget = targetRoom === portal.id
        return (
          <button
            key={portal.id}
            onClick={() => handleRoomClick(portal.id)}
            onMouseEnter={() => setHovered(portal.id)}
            onMouseLeave={() => setHovered(null)}
            disabled={walking}
            className="absolute flex flex-col items-center transition-transform"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) ${isHovered || isTarget ? 'scale(1.15)' : 'scale(1)'}`,
            }}
          >
            <div
              className="w-8 h-11 rounded-t-full flex items-center justify-center shadow-md border-2"
              style={{
                backgroundColor: portal.color,
                borderColor: isHovered || isTarget ? '#FBBF24' : 'rgba(255,255,255,0.3)',
                boxShadow: isHovered || isTarget ? `0 0 10px ${portal.color}` : undefined
              }}
            >
              <span style={{ fontSize: 14 }}>{portal.emoji}</span>
            </div>
            <div
              className="w-10 h-1.5 rounded-b"
              style={{ backgroundColor: portal.color, filter: 'brightness(0.7)' }}
            />
            {isHovered && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full">
                {portal.label}
              </div>
            )}
          </button>
        )
      })}

      {/* Player avatar — animated walk */}
      <div
        className="absolute flex flex-col items-center pointer-events-none z-20"
        style={{
          left: `${avatarPos.x}%`,
          top: `${avatarPos.y}%`,
          transform: 'translate(-50%, -50%)',
          transition: walking ? `left ${WALK_DURATION_MS}ms ease-in-out, top ${WALK_DURATION_MS}ms ease-in-out` : 'none',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
        }}
      >
        <AvatarRenderer avatar={avatarData} size={36} />
        <p className="text-white text-[8px] font-bold text-center bg-black/40 px-1.5 rounded-full mt-0.5 whitespace-nowrap">
          {playerName.length > 10 ? playerName.slice(0, 10) + '…' : playerName}
        </p>
      </div>

      {walking && portal && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] px-2 py-1 rounded-full whitespace-nowrap">
          Walking to {portal.label}...
        </div>
      )}

      {!walking && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-[8px] whitespace-nowrap">
          Click a room to enter
        </div>
      )}
    </div>
  )
}
