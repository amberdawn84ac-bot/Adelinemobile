import { SEASON_TIERS } from '../../types/game'

interface Props {
  currentXP: number
  claimedTiers: number[]
  onClaimTier: (tier: number, coinsToAdd: number) => void
  onClose: () => void
}

export default function SeasonPass({ currentXP, claimedTiers, onClaimTier, onClose }: Props) {
  const currentTier = SEASON_TIERS.filter(t => currentXP >= t.xpRequired).length

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-bold text-xl font-serif">🌟 Season Pass</h2>
          <p className="text-white/50 text-xs mt-0.5">Season 1 · {currentXP} XP total · Tier {currentTier}/{SEASON_TIERS.length}</p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white text-2xl px-2">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {SEASON_TIERS.map((tier, i) => {
          const unlocked = currentXP >= tier.xpRequired
          const claimed = claimedTiers.includes(tier.tier)
          const canClaim = unlocked && !claimed

          return (
            <div
              key={tier.tier}
              className={`rounded-2xl p-4 border transition-all ${
                unlocked ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      unlocked ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/30'
                    }`}
                  >
                    {claimed ? '✓' : tier.tier}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${unlocked ? 'text-white' : 'text-white/30'}`}>
                      {tier.reward}
                    </p>
                    <p className="text-white/40 text-xs">{tier.xpRequired} XP required</p>
                  </div>
                </div>

                {canClaim ? (
                  <button
                    onClick={() => onClaimTier(tier.tier, tier.rewardType === 'adecoin' ? (tier.rewardAmount ?? 0) : 0)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl transition-all animate-pulse"
                  >
                    Claim!
                  </button>
                ) : claimed ? (
                  <span className="text-emerald-400 text-xs font-bold">Claimed ✓</span>
                ) : (
                  <span className="text-white/20 text-xs">
                    {tier.xpRequired - currentXP} XP away
                  </span>
                )}
              </div>

              {!unlocked && i === currentTier && (
                <div className="mt-3">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${Math.round(currentXP / tier.xpRequired * 100)}%` }}
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-1 text-right">
                    {currentXP} / {tier.xpRequired} XP
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
