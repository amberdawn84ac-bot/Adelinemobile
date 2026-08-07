// src/components/world/TownBuilding.tsx
import { TownBuilding as TownBuildingType } from '../../types/game'

interface Props {
  building: TownBuildingType
  isNearby: boolean
  isLocked: boolean
  onEnter: () => void
}

function jewelTone(color: string) {
  const map: Record<string, string> = {
    '#ef4444': '#8f2346',
    '#f97316': '#b45a2a',
    '#eab308': '#b88922',
    '#22c55e': '#28785c',
    '#14b8a6': '#1f6f74',
    '#3b82f6': '#285a8c',
    '#6366f1': '#4a3f83',
    '#8b5cf6': '#68418a',
    '#ec4899': '#983d68',
  }
  return map[color] ?? color
}

export default function TownBuilding({ building, isNearby, isLocked, onEnter }: Props) {
  const accent = jewelTone(building.color)

  return (
    <div
      className="absolute flex flex-col items-center group"
      style={{ left: `${building.position.x}%`, top: `${building.position.y}%`, transform: 'translate(-50%, -50%)', zIndex: isNearby ? 18 : 10 }}
    >
      {isNearby && (
        <button
          type="button"
          onClick={!isLocked ? onEnter : undefined}
          className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-full text-[11px] tracking-[0.18em] uppercase shadow-xl transition-transform bg-[#f6f0df]/95 text-[#2d2924] border border-[#2d2924]/20 backdrop-blur-sm"
          style={{ transform: 'translateX(-50%) rotate(-1deg)' }}
        >
          {isLocked ? 'The road is closed for now' : 'Step inside'}
        </button>
      )}

      <button
        type="button"
        aria-label={`Enter ${building.name}`}
        onClick={!isLocked ? onEnter : undefined}
        className={`relative w-[106px] h-[96px] transition-all duration-300 ${isLocked ? 'opacity-45 grayscale' : 'cursor-pointer'} ${isNearby ? 'scale-110' : 'group-hover:scale-105'}`}
      >
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[96px] h-[50px] border-[3px] border-[#2d2924] bg-[#e7dfca]"
          style={{ clipPath: 'polygon(50% 0, 100% 72%, 90% 100%, 10% 100%, 0 72%)', boxShadow: '2px 4px 0 rgba(45,41,36,.16)', transform: 'translateX(-50%) rotate(-1deg)' }}
        />
        <span
          className="absolute left-1/2 bottom-1 -translate-x-1/2 w-[84px] h-[62px] border-[3px] border-[#2d2924] bg-[#f4eddc] shadow-lg"
          style={{ transform: 'translateX(-50%) rotate(.6deg)' }}
        />
        <span className="absolute left-[26px] bottom-[27px] w-[18px] h-[20px] border-2 border-[#2d2924] bg-[#d9ecdf]" />
        <span className="absolute right-[26px] bottom-[27px] w-[18px] h-[20px] border-2 border-[#2d2924] bg-[#d9ecdf]" />
        <span
          className="absolute left-1/2 bottom-[4px] -translate-x-1/2 w-[21px] h-[34px] border-2 border-[#2d2924]"
          style={{ background: accent }}
        />
        <span
          className="absolute -left-1 bottom-2 w-[28px] h-[12px] border-b-2 border-[#2d2924] opacity-80"
          style={{ borderRadius: '50%', transform: 'rotate(-9deg)' }}
        />
        <span
          className="absolute -right-2 bottom-3 w-[30px] h-[14px] border-b-2 border-[#2d2924] opacity-80"
          style={{ borderRadius: '50%', transform: 'rotate(11deg)' }}
        />
        {isNearby && !isLocked && (
          <span className="absolute inset-0 rounded-[38%] blur-2xl -z-10 opacity-35" style={{ background: accent }} />
        )}
      </button>

      <div className="mt-1 text-center max-w-[132px]">
        <p className="font-serif font-semibold text-[13px] text-[#2d2924] leading-tight drop-shadow-[0_1px_0_rgba(255,255,255,.65)]">
          {building.name}
        </p>
        {isNearby && !isLocked && (
          <p className="mt-1 text-[10px] italic text-[#4d463e]/75 leading-tight">{building.description}</p>
        )}
      </div>
    </div>
  )
}
