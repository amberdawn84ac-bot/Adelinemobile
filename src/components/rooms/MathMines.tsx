import { useState, useEffect } from 'react'

interface Props {
  playerName: string
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
}

interface Quest {
  question: string
  answer: string
  hint: string
  xpReward: number
  coinReward: number
}

const FALLBACK_QUESTS: Quest[] = [
  { question: "Farmer Adeline has 3 rows of corn with 7 plants in each row. How many corn plants does she have?", answer: "21", hint: "Try 3 × 7", xpReward: 25, coinReward: 5 },
  { question: "You need to can 48 jars of tomatoes in groups of 6. How many groups is that?", answer: "8", hint: "Try 48 ÷ 6", xpReward: 25, coinReward: 5 },
  { question: "The sheep produce 5 pounds of wool each week. How much wool in 4 weeks?", answer: "20", hint: "Try 5 × 4", xpReward: 30, coinReward: 8 },
  { question: "You have 100 square feet of garden. You use 35 for tomatoes and 28 for squash. How much is left?", answer: "37", hint: "100 - 35 - 28", xpReward: 35, coinReward: 10 },
]

export default function MathMines({ playerName, onXpEarned, onCoinsEarned }: Props) {
  const [quest, setQuest] = useState<Quest | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [questIndex, setQuestIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)

  useEffect(() => { loadQuest() }, [questIndex])

  async function loadQuest() {
    setLoading(true)
    setFeedback(null)
    setUserAnswer('')
    setShowHint(false)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create ONE math word problem for a homeschool student. It should involve real-world homesteading, farming, cooking, or building. Make it fun and short (2 sentences max). Also provide: the numeric answer, a one-sentence hint, and reward values (xpReward between 20-50, coinReward between 5-15). Respond ONLY with valid JSON in this exact format: {"question":"...","answer":"...","hint":"...","xpReward":25,"coinReward":8}`,
          history: []
        })
      })
      const data = await response.json()
      const parsed = JSON.parse(data.reply.replace(/```json|```/g, '').trim())
      if (parsed.question && parsed.answer) setQuest(parsed)
      else throw new Error('Invalid format')
    } catch {
      setQuest(FALLBACK_QUESTS[questIndex % FALLBACK_QUESTS.length])
    } finally {
      setLoading(false)
    }
  }

  function checkAnswer() {
    if (!quest) return
    const correct = userAnswer.trim().replace(/[^0-9.]/g, '') === quest.answer.replace(/[^0-9.]/g, '')
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) {
      const bonus = streak >= 2 ? Math.round(quest.xpReward * 0.5) : 0
      onXpEarned(quest.xpReward + bonus)
      onCoinsEarned(quest.coinReward)
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <span className="text-3xl">⛏️</span>
        <div>
          <h2 className="text-white font-bold text-lg">Math Mines</h2>
          <p className="text-blue-300 text-xs">Dig for answers, {playerName}!</p>
        </div>
        {streak >= 2 && (
          <div className="ml-auto bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold px-3 py-1 rounded-full">
            🔥 {streak} streak!
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {loading ? (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-blue-300 text-sm">Adeline is preparing your quest...</p>
          </div>
        ) : quest ? (
          <>
            <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4 border border-white/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">⚡</span>
                </div>
                <p className="text-white text-base leading-relaxed">{quest.question}</p>
              </div>
              {showHint && (
                <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-3">
                  <p className="text-amber-300 text-sm">💡 Hint: {quest.hint}</p>
                </div>
              )}
            </div>

            {feedback === null && (
              <div className="w-full max-w-md space-y-3">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                  placeholder="Your answer..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/40 text-center text-xl font-bold focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowHint(true)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white/70 text-sm rounded-xl transition-all">
                    Need a hint?
                  </button>
                  <button onClick={checkAnswer} disabled={!userAnswer.trim()} className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all">
                    Submit →
                  </button>
                </div>
              </div>
            )}

            {feedback === 'correct' && (
              <div className="w-full max-w-md bg-emerald-500/20 border border-emerald-400 rounded-2xl p-5 text-center space-y-3">
                <p className="text-4xl">🎉</p>
                <p className="text-emerald-300 font-bold text-lg">Correct!</p>
                <p className="text-white/70 text-sm">+{quest.xpReward} XP · +{quest.coinReward} AdeCoins</p>
                {streak >= 2 && <p className="text-amber-300 text-xs">🔥 Streak bonus! +{Math.round(quest.xpReward * 0.5)} XP</p>}
                <button onClick={() => setQuestIndex(i => i + 1)} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl">
                  Next Quest →
                </button>
              </div>
            )}

            {feedback === 'wrong' && (
              <div className="w-full max-w-md bg-red-500/20 border border-red-400 rounded-2xl p-5 text-center space-y-3">
                <p className="text-4xl">💪</p>
                <p className="text-red-300 font-bold">Not quite — try again!</p>
                <div className="flex gap-3">
                  <button onClick={() => { setFeedback(null); setUserAnswer(''); setShowHint(true) }} className="flex-1 py-2 bg-white/10 text-white rounded-xl text-sm">
                    Try Again
                  </button>
                  <button onClick={() => setQuestIndex(i => i + 1)} className="flex-1 py-2 bg-red-500/50 text-white rounded-xl text-sm">
                    Skip
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="flex justify-center gap-6 p-4 border-t border-white/10">
        {['💎', '🪨', '⚡', '🥇', '💎'].map((ore, i) => (
          <span key={i} className="text-2xl opacity-40">{ore}</span>
        ))}
      </div>
    </div>
  )
}
