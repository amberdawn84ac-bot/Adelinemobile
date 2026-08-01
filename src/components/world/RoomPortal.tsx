import { Portal } from '../../types/game'

interface Props {
  portal: Portal
  isNearby: boolean
  onEnter: () => void
}

export default function RoomPortal({ portal, isNearby, onEnter }: Props) {
  const locked = portal.locked === true

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${portal.x}%`, top: `${portal.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {isNearby && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 animate-bounce">
          {locked ? (
            <div className="bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              🔒 Coming Soon
            </div>
          ) : (
            <button
              onClick={onEnter}
              className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hover:bg-amber-50 transition-all"
            >
              Press E to enter →
            </button>
          )}
        </div>
      )}

      <div
        className={`relative transition-all duration-300 ${!locked && isNearby ? 'scale-110' : !locked ? 'hover:scale-105' : 'opacity-60'}`}
        onClick={!locked && isNearby ? onEnter : undefined}
        style={{ cursor: locked ? 'default' : isNearby ? 'pointer' : 'default' }}
      >
        <div
          className="w-20 h-28 rounded-t-full border-4 flex flex-col items-center justify-center gap-1 shadow-2xl relative"
          style={{
            backgroundColor: portal.color,
            borderColor: !locked && isNearby ? '#FBBF24' : 'rgba(255,255,255,0.3)',
            boxShadow: !locked && isNearby ? `0 0 20px ${portal.color}` : undefined,
            filter: locked ? 'grayscale(0.4)' : undefined,
          }}
        >
          <span className="text-3xl">{portal.emoji}</span>
          {locked && (
            <span className="text-xl absolute bottom-2">🔒</span>
          )}
        </div>
        <div
          className="w-24 h-3 rounded-b-lg -mt-1"
          style={{ backgroundColor: portal.color, filter: 'brightness(0.7)' }}
        />
      </div>

      <div className="mt-2 text-center">
        <p className={`font-bold text-sm drop-shadow ${locked ? 'text-white/60' : 'text-white'}`}>{portal.label}</p>
        <p className="text-white/50 text-xs drop-shadow">{locked ? 'Coming Soon' : portal.description}</p>
      </div>
    </div>
  )
}
