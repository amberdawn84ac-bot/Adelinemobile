import { useState, useEffect, useCallback, useRef } from 'react'
import { AvatarData, PlayerState, HUB_PORTALS, RoomId } from '../../types/game'
import AvatarRenderer from '../avatar/AvatarRenderer'
import AdelineNPC from './AdelineNPC'
import RoomPortal from './RoomPortal'

const ADELINE_X = 50
const ADELINE_Y = 60
const MOVE_SPEED = 1.5
const PROXIMITY = 12
const CHAT_PROXIMITY = 10

interface Props {
  avatarData: AvatarData
  playerName: string
  onEnterRoom: (roomId: RoomId) => void
  onChatAdeline: () => void
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

export default function HubWorld({ avatarData, playerName, onEnterRoom, onChatAdeline }: Props) {
  const [player, setPlayer] = useState<PlayerState>({ x: 50, y: 75, facing: 'up' })
  const keysPressed = useRef<Set<string>>(new Set())
  const animFrame = useRef<number>()
  const playerRef = useRef(player)
  playerRef.current = player

  const movePlayer = useCallback(() => {
    setPlayer(prev => {
      let { x, y, facing } = prev
      if (keysPressed.current.has('ArrowUp')    || keysPressed.current.has('w') || keysPressed.current.has('W')) { y -= MOVE_SPEED; facing = 'up' }
      if (keysPressed.current.has('ArrowDown')  || keysPressed.current.has('s') || keysPressed.current.has('S')) { y += MOVE_SPEED; facing = 'down' }
      if (keysPressed.current.has('ArrowLeft')  || keysPressed.current.has('a') || keysPressed.current.has('A')) { x -= MOVE_SPEED; facing = 'left' }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) { x += MOVE_SPEED; facing = 'right' }
      x = Math.max(3, Math.min(97, x))
      y = Math.max(10, Math.min(95, y))
      return { x, y, facing }
    })
    animFrame.current = requestAnimationFrame(movePlayer)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysPressed.current.add(e.key)
      if (e.key === 'e' || e.key === 'E') {
        const p = playerRef.current
        for (const portal of HUB_PORTALS) {
          if (distance(p.x, p.y, portal.x, portal.y) < PROXIMITY) {
            onEnterRoom(portal.id)
            return
          }
        }
        if (distance(p.x, p.y, ADELINE_X, ADELINE_Y) < CHAT_PROXIMITY) {
          onChatAdeline()
        }
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      keysPressed.current.delete(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    animFrame.current = requestAnimationFrame(movePlayer)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [movePlayer, onEnterRoom, onChatAdeline])

  const nearbyPortal = HUB_PORTALS.find(p => distance(player.x, player.y, p.x, p.y) < PROXIMITY)
  const nearAdeline = distance(player.x, player.y, ADELINE_X, ADELINE_Y) < CHAT_PROXIMITY

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Sky */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #b0e0ff 35%, #5DBB5D 35%, #228B22 100%)' }} />

      {/* Path/walkway */}
      <div className="absolute" style={{ left: '30%', top: '35%', width: '40%', height: '55%', background: 'rgba(210,180,140,0.6)', borderRadius: '8px' }} />

      {/* Trees */}
      {[{x:8,y:45},{x:15,y:55},{x:85,y:48},{x:90,y:58},{x:5,y:70},{x:93,y:65}].map((t,i) => (
        <div key={i} className="absolute" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
          <div style={{ width: 24, height: 30, background: '#1a6b1a', borderRadius: '50% 50% 30% 30%', marginLeft: -12 }} />
          <div style={{ width: 6, height: 14, background: '#5D4037', marginLeft: -3 }} />
        </div>
      ))}

      {/* Hub sign */}
      <div className="absolute" style={{ left: '50%', top: '22%', transform: 'translateX(-50%)' }}>
        <div className="bg-amber-800 text-amber-100 font-bold text-sm px-4 py-2 rounded-lg shadow-lg border-2 border-amber-600">
          🏘️ Adeline Hub
        </div>
      </div>

      {/* Adeline NPC */}
      <AdelineNPC x={ADELINE_X} y={ADELINE_Y} onChat={onChatAdeline} />

      {/* Room portals */}
      {HUB_PORTALS.map(portal => (
        <RoomPortal
          key={portal.id}
          portal={portal}
          isNearby={nearbyPortal?.id === portal.id}
          onEnter={() => onEnterRoom(portal.id)}
        />
      ))}

      {/* Player */}
      <div
        className="absolute transition-none"
        style={{ left: `${player.x}%`, top: `${player.y}%`, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))', zIndex: 20 }}
      >
        <AvatarRenderer avatar={avatarData} size={56} />
        <p className="text-white text-xs font-bold text-center mt-1 drop-shadow bg-black/40 rounded-full px-2">{playerName}</p>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
        WASD / Arrow keys to move · E to enter
      </div>

      {/* Chat nudge */}
      {nearAdeline && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-bounce">
          Press E to talk to Adeline
        </div>
      )}
    </div>
  )
}
