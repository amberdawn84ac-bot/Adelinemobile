import { Portal } from '../../types/game'

interface Props {
  portal: Portal
  isNearby: boolean
  onEnter: () => void
}

export default function RoomPortal({ portal, isNearby, onEnter }: Props) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${portal.x}%`, top: `${portal.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {isNearby && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 animate-bounce">
          <button
            onClick={onEnter}
            className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hover:bg-amber-50 transition-all"
          >
            Press E to enter →
          </button>
        </div>
      )}
      <div
        className={`relative cursor-pointer transition-all duration-300 ${isNearby ? 'scale-110' : 'hover:scale-105'}`}
        onClick={isNearby ? onEnter : undefined}
      >
        <div
          className="w-20 h-28 rounded-t-full border-4 flex flex-col items-center justify-center gap-1 shadow-2xl"
          style={{
            backgroundColor: portal.color,
            borderColor: isNearby ? '#FBBF24' : 'rgba(255,255,255,0.3)',
            boxShadow: isNearby ? `0 0 20px ${portal.color}` : undefined
          }}
        >
          <span className="text-3xl">{portal.emoji}</span>
        </div>
        <div className="w-24 h-3 rounded-b-lg -mt-1" style={{ backgroundColor: portal.color, filter: 'brightness(0.7)' }} />
      </div>
      <div className="mt-2 text-center">
        <p className="text-white font-bold text-sm drop-shadow">{portal.label}</p>
        <p className="text-white/70 text-xs drop-shadow">{portal.description}</p>
      </div>
    </div>
  )
}
