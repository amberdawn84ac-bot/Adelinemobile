import { Track, TRACK_LABELS, TRACK_COLORS } from '../../types/game'

export interface PendingActivity {
  description: string
  tracks: Track[]
  xpReward: number
  coinReward: number
}

interface Props {
  activity: PendingActivity
  onConfirm: () => void
  onDismiss: () => void
}

export default function ActivityConfirm({ activity, onConfirm, onDismiss }: Props) {
  return (
    <div className="mx-4 mb-3 bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📋</span>
        <div className="flex-1">
          <p className="text-amber-900 font-bold text-sm">Log this to your Life Map?</p>
          <p className="text-amber-800 text-sm mt-1">"{activity.description}"</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {activity.tracks.map(track => (
          <span
            key={track}
            className="text-xs font-semibold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: TRACK_COLORS[track] }}
          >
            {TRACK_LABELS[track]}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-amber-700">
          +{activity.xpReward} XP · +{activity.coinReward} AdeCoins
        </span>
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100 rounded-lg transition-all"
          >
            Skip
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-lg transition-all"
          >
            Yes, log it! ✓
          </button>
        </div>
      </div>
    </div>
  )
}
