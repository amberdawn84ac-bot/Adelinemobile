import { StudentUser } from '../../types/auth'
import { GuestSession } from '../../types/auth'
import { AvatarData } from '../../types/game'
import AvatarRenderer from '../avatar/AvatarRenderer'

interface Props {
  player: StudentUser | null
  guestSession: (GuestSession & { xp: number; adeCoins: number }) | null
  avatarData: AvatarData
  roomLabel?: string
  onExitRoom?: () => void
  onSignOut: () => void
}

export default function GameHUD({ player, guestSession, avatarData, roomLabel, onExitRoom, onSignOut }: Props) {
  const name = player?.display_name ?? guestSession?.displayName ?? 'Explorer'
  const xp = player?.xp ?? guestSession?.xp ?? 0
  const coins = player?.ade_coins ?? guestSession?.adeCoins ?? 0
  const xpMax = 500
  const xpPct = Math.min(100, Math.round((xp % xpMax) / xpMax * 100))

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-start justify-between p-3 gap-3">
        <div className="bg-black/70 backdrop-blur rounded-2xl px-3 py-2 flex items-center gap-3 pointer-events-auto">
          <AvatarRenderer avatar={avatarData} size={36} />
          <div>
            <p className="text-white font-bold text-sm leading-tight">{name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
              </div>
              <span className="text-amber-300 text-xs font-semibold">{xp} XP</span>
            </div>
          </div>
        </div>

        {roomLabel && (
          <div className="bg-black/70 backdrop-blur rounded-2xl px-4 py-2 text-center">
            <p className="text-white font-bold text-sm">{roomLabel}</p>
          </div>
        )}

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur rounded-2xl px-3 py-2 flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <span className="text-amber-300 font-bold text-sm">{coins}</span>
          </div>
          {onExitRoom ? (
            <button onClick={onExitRoom} className="bg-black/70 backdrop-blur rounded-xl px-3 py-1.5 text-white text-xs font-semibold hover:bg-white/20 transition-all">
              ← Hub
            </button>
          ) : (
            <button onClick={onSignOut} className="bg-black/70 backdrop-blur rounded-xl px-3 py-1.5 text-white/60 text-xs hover:text-white transition-all">
              Exit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
