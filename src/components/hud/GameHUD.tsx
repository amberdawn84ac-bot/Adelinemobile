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
  const coins = player?.ade_coins ?? guestSession?.adeCoins ?? 0

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-start justify-between p-3 gap-3">
        <div
          className="pointer-events-auto flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1.5 border border-[#2f2a23]/15 shadow-lg"
          style={{ background: 'rgba(247,241,224,.9)', backdropFilter: 'blur(8px)' }}
        >
          <div className="rounded-full overflow-hidden ring-1 ring-[#322b24]/20 bg-[#efe4cc]">
            <AvatarRenderer avatar={avatarData} size={34} />
          </div>
          <div className="leading-none">
            <p className="text-[#29251f] font-serif text-[13px]">{name}</p>
            <p className="text-[#6d6356] text-[9px] uppercase tracking-[0.16em] mt-1">in town</p>
          </div>
        </div>

        {roomLabel && (
          <div
            className="px-4 py-2 rounded-full border border-[#2f2a23]/15 shadow-md"
            style={{ background: 'rgba(247,241,224,.88)', backdropFilter: 'blur(8px)' }}
          >
            <p className="text-[#312c25] font-serif text-[13px]">{roomLabel}</p>
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="px-3 py-2 rounded-full border border-[#2f2a23]/15 bg-[#f7f1e0]/90 shadow-md flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b78a2e] shadow-[0_0_8px_rgba(183,138,46,.35)]" />
            <span className="text-[#4d4438] text-[11px] font-semibold">{coins}</span>
          </div>
          <button
            onClick={onExitRoom ?? onSignOut}
            className="px-3 py-2 rounded-full border border-[#2f2a23]/15 bg-[#f7f1e0]/90 text-[#4d4438] text-[11px] hover:bg-[#fffaf0] transition-colors shadow-md"
          >
            {onExitRoom ? 'Town' : 'Leave'}
          </button>
        </div>
      </div>
    </div>
  )
}
