import { useState, useEffect } from 'react'
import { Track } from '../../types/game'

interface Props {
  roomId: string
  roomLabel: string
  roomEmoji: string
  roomTracks: Track[]
  playerName: string
  systemContext: string
  onComplete: (description: string, tracks: Track[], xp: number, coins: number) => void
  onBack: () => void
}

interface Mission {
  title: string
  description: string
  prompt: string
  xpReward: number
  coinReward: number
}

export default function RoomMission({ roomId, roomLabel, roomEmoji, roomTracks, playerName, systemContext, onComplete, onBack }: Props) {
  const [mission, setMission] = useState<Mission | null>(null)
  const [response, setResponse] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => { loadMission() }, [])

  async function loadMission() {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a real-world mission for a homeschool student in the ${roomLabel} subject area. ${systemContext}

The mission should:
- Be something they can actually DO or THINK THROUGH right now
- Require a written response (not multiple choice)
- Connect to real life, homesteading, farming, nature, history, or their community
- Be completable in 5-15 minutes
- Have a clear prompt they respond to

Respond ONLY with valid JSON:
{"title":"...","description":"...what they'll do, 2-3 sentences...","prompt":"...the specific question or task they respond to...","xpReward":60,"coinReward":15}`,
          history: [],
        })
      })
      const data = await res.json()
      const parsed = JSON.parse(data.reply.replace(/```json|```/g, '').trim())
      if (parsed.title && parsed.prompt) setMission(parsed)
      else throw new Error('bad format')
    } catch {
      setMission(getFallbackMission(roomId))
    } finally {
      setLoading(false)
    }
  }

  async function submitResponse() {
    if (!response.trim() || !mission) return
    setEvaluating(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `A student named ${playerName} completed this mission:
Mission: "${mission.title}"
Task: "${mission.prompt}"
Their response: "${response}"

Evaluate their response in 2-3 sentences. Be encouraging but honest. If they put in real effort, affirm it. If they were vague, nudge them to go deeper next time. End with one specific thing they did well.`,
          history: [],
        })
      })
      const data = await res.json()
      setFeedback(data.reply)
      setCompleted(true)
      const description = `${mission.title}: ${response.slice(0, 120)}${response.length > 120 ? '...' : ''}`
      onComplete(description, roomTracks, mission.xpReward, mission.coinReward)
    } catch {
      setFeedback("Great work completing this mission! Keep building on what you know.")
      setCompleted(true)
      onComplete(response.slice(0, 120), roomTracks, mission?.xpReward ?? 40, mission?.coinReward ?? 10)
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/95 text-white">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button onClick={onBack} className="text-white/60 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10">
          ← Back
        </button>
        <span className="text-2xl">{roomEmoji}</span>
        <div>
          <h2 className="font-bold">{roomLabel} — Mission</h2>
          <p className="text-white/50 text-xs">Real work, real learning</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 overflow-y-auto">
        {loading ? (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/60 text-sm">Adeline is preparing your mission...</p>
          </div>
        ) : mission && !completed ? (
          <>
            <div className="w-full max-w-lg bg-white/10 rounded-2xl p-5 border border-white/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Mission</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>
              <h3 className="text-white font-bold text-lg">{mission.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{mission.description}</p>
            </div>

            <div className="w-full max-w-lg space-y-3">
              <p className="text-white font-semibold text-sm">{mission.prompt}</p>
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Write your response here... Take your time. There's no right answer — this is about YOUR thinking."
                className="w-full h-40 px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs">{response.length} characters</span>
                <button
                  onClick={submitResponse}
                  disabled={response.trim().length < 20 || evaluating}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                >
                  {evaluating ? 'Adeline is reading...' : 'Submit Mission →'}
                </button>
              </div>
              {response.trim().length < 20 && response.length > 0 && (
                <p className="text-white/40 text-xs">Write a bit more — at least 20 characters to submit.</p>
              )}
            </div>

            <div className="text-center">
              <p className="text-white/40 text-xs">+{mission.xpReward} XP · +{mission.coinReward} AdeCoins on completion · Logged to Life Map</p>
            </div>
          </>
        ) : completed && feedback ? (
          <div className="w-full max-w-lg space-y-5">
            <div className="bg-emerald-500/20 border border-emerald-400 rounded-2xl p-5 space-y-3">
              <p className="text-4xl text-center">🎉</p>
              <p className="text-emerald-300 font-bold text-center">Mission Complete!</p>
              <p className="text-white/80 text-sm leading-relaxed">{feedback}</p>
              <p className="text-amber-300 text-xs text-center">+{mission?.xpReward} XP · +{mission?.coinReward} AdeCoins · Added to Life Map</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onBack} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl">
                ← Back to World
              </button>
              <button
                onClick={() => { setCompleted(false); setResponse(''); setFeedback(null); loadMission() }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl"
              >
                Next Mission →
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function getFallbackMission(roomId: string): Mission {
  const missions: Record<string, Mission> = {
    math_mines: {
      title: 'Budget Your Garden',
      description: 'Plan a small vegetable garden and figure out what it would cost to plant it.',
      prompt: "Pick 3 vegetables to grow. Estimate how many seeds or seedlings you need and what they might cost. How much space do you need? Write out your plan and calculations.",
      xpReward: 60,
      coinReward: 15
    },
    story_forest: {
      title: 'Tell Your Story',
      description: "Every family has stories worth preserving. Think about something that happened in your family or community.",
      prompt: "Write 3-5 sentences about a real event in your family's history or something that happened recently. Include who was there, what happened, and why it matters.",
      xpReward: 60,
      coinReward: 15
    },
    science_lab: {
      title: 'Kitchen Science Observation',
      description: 'Science is everywhere in your home. Pick something you can observe or test right now.',
      prompt: "Choose one of these and describe what you observe: (1) What happens when you mix baking soda and vinegar? (2) How does bread dough rise? (3) What do you notice about how water moves through soil or sand? Write what you observe and why you think it happens.",
      xpReward: 60,
      coinReward: 15
    },
    homestead_farm: {
      title: 'Animal Care Log',
      description: 'Taking care of animals is real science, math, and stewardship all at once.',
      prompt: "Think about an animal your family cares for (or would like to care for). What does it eat? How much? How do you keep it healthy? What does it give back to the family? Write a short care guide for it.",
      xpReward: 65,
      coinReward: 18
    },
    truth_archive: {
      title: 'Follow the Money',
      description: "Behind almost every historical event, there is someone who profits. Let's find them.",
      prompt: "Pick one of these events: (1) Why did Columbus sail west? (2) Why did factories replace farms in the 1800s? (3) Why do food companies add sugar to almost everything? Write 3-5 sentences about who benefited and how.",
      xpReward: 70,
      coinReward: 18
    },
  }
  return missions[roomId] ?? missions.math_mines
}
