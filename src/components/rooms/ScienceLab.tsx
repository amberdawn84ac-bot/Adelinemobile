import { useState, useEffect } from 'react'

interface Props {
  playerName: string
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
}

interface Experiment {
  scenario: string
  question: string
  choices: string[]
  correctIndex: number
  explanation: string
  xpReward: number
  coinReward: number
}

const FALLBACK_EXPERIMENTS: Experiment[] = [
  {
    scenario: "You plant two identical tomato seedlings. One gets 6 hours of sunlight daily, the other gets 1 hour. After 3 weeks, the first plant is tall and flowering. The second is small and pale.",
    question: "What does this experiment show?",
    choices: ["Tomatoes prefer cool weather", "Plants need sunlight to grow well", "Watering is more important than sunlight", "Both plants will eventually look the same"],
    correctIndex: 1,
    explanation: "The only difference between the plants was sunlight. Since the plant with more sun grew better, we can conclude sunlight is essential for healthy growth — this is how God designed photosynthesis to work.",
    xpReward: 30,
    coinReward: 8
  },
  {
    scenario: "When you mix baking soda and vinegar, the mixture bubbles rapidly and the container feels colder. The bubbles are carbon dioxide gas escaping.",
    question: "What type of reaction is this?",
    choices: ["A physical change — no new substance was made", "A chemical reaction — new substances were created", "The baking soda just dissolved in vinegar", "Heat caused the bubbling"],
    correctIndex: 1,
    explanation: "A chemical reaction occurred: the baking soda (sodium bicarbonate) and vinegar (acetic acid) reacted to form carbon dioxide gas, water, and sodium acetate — entirely new substances.",
    xpReward: 35,
    coinReward: 10
  },
]

export default function ScienceLab({ playerName, onXpEarned, onCoinsEarned }: Props) {
  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [questIndex, setQuestIndex] = useState(0)

  useEffect(() => { loadExperiment() }, [questIndex])

  async function loadExperiment() {
    setLoading(true)
    setSelected(null)
    setRevealed(false)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a science observation or experiment scenario for a homeschool student. Base it on creation science, nature, farming, chemistry with household items, or animal biology. Write 2-3 sentences describing what happens, then a multiple-choice question with 4 options. Include a faith-friendly explanation grounded in how God designed creation. Respond ONLY with valid JSON: {"scenario":"...","question":"...","choices":["...","...","...","..."],"correctIndex":0,"explanation":"...","xpReward":30,"coinReward":8}`,
          history: []
        })
      })
      const data = await res.json()
      const parsed = JSON.parse(data.reply.replace(/```json|```/g, '').trim())
      if (parsed.scenario && parsed.choices?.length === 4) setExperiment(parsed)
      else throw new Error('bad format')
    } catch {
      setExperiment(FALLBACK_EXPERIMENTS[questIndex % FALLBACK_EXPERIMENTS.length])
    } finally {
      setLoading(false)
    }
  }

  function check() {
    if (selected === null || !experiment) return
    setRevealed(true)
    if (selected === experiment.correctIndex) {
      onXpEarned(experiment.xpReward)
      onCoinsEarned(experiment.coinReward)
    }
  }

  const isCorrect = revealed && selected === experiment?.correctIndex

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0c1a2e 0%, #0e3a4a 50%, #0a2535 100%)' }}>
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <span className="text-3xl">🔬</span>
        <div>
          <h2 className="text-white font-bold text-lg">Science Lab</h2>
          <p className="text-cyan-300 text-xs">Discover God's design, {playerName}!</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 overflow-y-auto">
        {loading ? (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-cyan-300 text-sm">Preparing your experiment...</p>
          </div>
        ) : experiment ? (
          <>
            <div className="w-full max-w-lg bg-cyan-900/30 backdrop-blur rounded-2xl p-5 border border-cyan-400/20">
              <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-2">🧪 Observe</p>
              <p className="text-white/90 text-sm leading-relaxed">{experiment.scenario}</p>
            </div>
            <div className="w-full max-w-lg">
              <p className="text-white font-semibold text-sm mb-3">{experiment.question}</p>
              <div className="space-y-2">
                {experiment.choices.map((choice, i) => {
                  let cls = 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  if (selected === i && !revealed) cls = 'bg-cyan-600/40 border border-cyan-400 text-white'
                  if (revealed && i === experiment.correctIndex) cls = 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-200'
                  if (revealed && selected === i && i !== experiment.correctIndex) cls = 'bg-red-500/30 border-2 border-red-400 text-red-200'
                  return (
                    <button key={i} onClick={() => !revealed && setSelected(i)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${cls}`}>
                      <span className="font-bold mr-2">{String.fromCharCode(65+i)}.</span>{choice}
                    </button>
                  )
                })}
              </div>
            </div>
            {!revealed ? (
              <button onClick={check} disabled={selected === null}
                className="w-full max-w-lg py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl">
                Submit Observation →
              </button>
            ) : (
              <div className={`w-full max-w-lg rounded-2xl p-4 space-y-2 ${isCorrect ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-red-500/20 border border-red-400'}`}>
                <p className={`font-bold ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>{isCorrect ? '🎉 Great observation!' : '🔭 Good try!'}</p>
                <p className="text-white/80 text-sm">{experiment.explanation}</p>
                {isCorrect && <p className="text-amber-300 text-xs">+{experiment.xpReward} XP · +{experiment.coinReward} AdeCoins</p>}
                <button onClick={() => setQuestIndex(i => i + 1)}
                  className={`w-full py-2 rounded-xl text-white font-semibold mt-2 ${isCorrect ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  Next Experiment →
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="flex justify-center gap-4 p-3 border-t border-white/10">
        {['🧬','⚗️','🔭','🌡️','💧'].map((e,i) => <span key={i} className="text-xl opacity-40">{e}</span>)}
      </div>
    </div>
  )
}
