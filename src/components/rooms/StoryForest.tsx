import { useState, useEffect } from 'react'

interface Props {
  playerName: string
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
}

interface StoryQuest {
  passage: string
  question: string
  choices: string[]
  correctIndex: number
  explanation: string
  xpReward: number
  coinReward: number
}

const FALLBACK_QUESTS: StoryQuest[] = [
  {
    passage: "Early settlers had to preserve food before winter. They would smoke meats, dry fruits, and pickle vegetables in salt brine. A good harvest and careful preservation meant survival through the cold months.",
    question: "What is the main idea of this passage?",
    choices: ["Settlers enjoyed eating pickles", "Preserving food was essential for winter survival", "Salt was rare and valuable", "Settlers preferred smoked meat over fresh meat"],
    correctIndex: 1,
    explanation: "The passage focuses on how preservation was necessary for surviving winter — not just one method or preference.",
    xpReward: 30,
    coinReward: 8
  },
  {
    passage: "Benjamin Franklin once wrote: 'An investment in knowledge pays the best interest.' He believed that reading and learning were more valuable than gold because knowledge cannot be stolen or lost to fire.",
    question: "According to Franklin, why is knowledge more valuable than gold?",
    choices: ["Knowledge is easier to carry", "Gold can rust and tarnish", "Knowledge cannot be stolen or destroyed", "Franklin owned no gold"],
    correctIndex: 2,
    explanation: "Franklin specifically said knowledge cannot be stolen or lost to fire — those are the reasons he valued it above gold.",
    xpReward: 30,
    coinReward: 8
  }
]

export default function StoryForest({ playerName, onXpEarned, onCoinsEarned }: Props) {
  const [quest, setQuest] = useState<StoryQuest | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [questIndex, setQuestIndex] = useState(0)

  useEffect(() => { loadQuest() }, [questIndex])

  async function loadQuest() {
    setLoading(true)
    setSelected(null)
    setRevealed(false)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a short reading comprehension quest for a homeschool student. Write a 2-3 sentence passage about history, nature, homesteading, faith, or literature. Then write a multiple-choice question with 4 choices. Respond ONLY with valid JSON: {"passage":"...","question":"...","choices":["...","...","...","..."],"correctIndex":0,"explanation":"...","xpReward":30,"coinReward":8}`,
          history: []
        })
      })
      const data = await response.json()
      const parsed = JSON.parse(data.reply.replace(/```json|```/g, '').trim())
      if (parsed.passage && parsed.choices?.length === 4) setQuest(parsed)
      else throw new Error('Invalid format')
    } catch {
      setQuest(FALLBACK_QUESTS[questIndex % FALLBACK_QUESTS.length])
    } finally {
      setLoading(false)
    }
  }

  function check() {
    if (selected === null || !quest) return
    setRevealed(true)
    if (selected === quest.correctIndex) {
      onXpEarned(quest.xpReward)
      onCoinsEarned(quest.coinReward)
    }
  }

  const isCorrect = revealed && selected === quest?.correctIndex

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0a2e0a 0%, #1a4a1a 40%, #0d3b0d 100%)' }}>
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <span className="text-3xl">🌲</span>
        <div>
          <h2 className="text-white font-bold text-lg">Story Forest</h2>
          <p className="text-green-300 text-xs">Where words grow wild, {playerName}!</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        {loading ? (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-green-300 text-sm">Adeline is opening a story scroll...</p>
          </div>
        ) : quest ? (
          <>
            <div className="w-full max-w-lg bg-amber-50/10 backdrop-blur rounded-2xl p-5 border border-amber-200/20">
              <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider mb-2">📜 Read this passage</p>
              <p className="text-white/90 text-sm leading-relaxed">{quest.passage}</p>
            </div>
            <div className="w-full max-w-lg">
              <p className="text-white font-semibold text-sm mb-3">{quest.question}</p>
              <div className="space-y-2">
                {quest.choices.map((choice, i) => {
                  let style = 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  if (selected === i && !revealed) style = 'bg-green-600/40 border border-green-400 text-white'
                  if (revealed && i === quest.correctIndex) style = 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-200'
                  if (revealed && selected === i && i !== quest.correctIndex) style = 'bg-red-500/30 border-2 border-red-400 text-red-200'
                  return (
                    <button key={i} onClick={() => !revealed && setSelected(i)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${style}`}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{choice}
                    </button>
                  )
                })}
              </div>
            </div>
            {!revealed ? (
              <button onClick={check} disabled={selected === null}
                className="w-full max-w-lg py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all">
                Check Answer →
              </button>
            ) : (
              <div className={`w-full max-w-lg rounded-2xl p-4 space-y-2 ${isCorrect ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-red-500/20 border border-red-400'}`}>
                <p className={`font-bold ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>{isCorrect ? '🎉 Well read!' : '📚 Good try!'}</p>
                <p className="text-white/80 text-sm">{quest.explanation}</p>
                {isCorrect && <p className="text-amber-300 text-xs">+{quest.xpReward} XP · +{quest.coinReward} AdeCoins</p>}
                <button onClick={() => setQuestIndex(i => i + 1)}
                  className={`w-full py-2 rounded-xl text-white font-semibold mt-2 ${isCorrect ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  Next Story →
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="flex justify-center gap-4 p-3 border-t border-white/10">
        {['🍄', '🌿', '🦋', '🌸', '🍃'].map((e, i) => (
          <span key={i} className="text-xl opacity-40">{e}</span>
        ))}
      </div>
    </div>
  )
}
