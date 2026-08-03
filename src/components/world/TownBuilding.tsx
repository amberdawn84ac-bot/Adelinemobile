// src/components/world/TownBuilding.tsx
import { TownBuilding as TownBuildingType } from '../../types/game'

interface Props {
  building: TownBuildingType
  isNearby: boolean
  isLocked: boolean
  onEnter: () => void
}

export default function TownBuilding({ building, isNearby, isLocked, onEnter }: Props) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${building.position.x}%`, top: `${building.position.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
    >
      {/* Proximity prompt */}
      {isNearby && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 animate-bounce">
          {isLocked ? (
            <div className="bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              🔒 Unlock at {building.unlockXP} XP
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

      {/* Building icon */}
      <div
        className={`
          w-20 h-20 rounded-2xl border-4 flex items-center justify-center shadow-2xl transition-all duration-300
          ${isLocked ? 'opacity-60 grayscale' : ''}
          ${!isLocked && isNearby ? 'scale-110 ring-4 ring-amber-300/60' : ''}
          ${!isLocked && !isNearby ? 'hover:scale-105' : ''}
        `}
        style={{
          backgroundColor: building.color,
          borderColor: !isLocked && isNearby ? '#FBBF24' : 'rgba(255,255,255,0.3)',
          boxShadow: !isLocked && isNearby ? `0 0 24px ${building.color}` : undefined,
          cursor: isLocked ? 'default' : 'pointer',
        }}
        onClick={!isLocked ? onEnter : undefined}
      >
        <span className="text-4xl">{building.emoji}</span>
        {isLocked && (
          <span className="text-xl absolute bottom-1 right-1">🔒</span>
        )}
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <p className={`font-bold text-sm drop-shadow ${isLocked ? 'text-white/50' : 'text-white'}`}>
          {building.name}
        </p>
        <p className="text-white/50 text-[10px] drop-shadow max-w-[90px] text-center leading-tight">
          {isLocked ? `Unlocks at ${building.unlockXP} XP` : building.description}
        </p>
      </div>
    </div>
  )
}
