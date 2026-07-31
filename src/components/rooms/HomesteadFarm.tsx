import { useState, useEffect } from 'react'

interface Props {
  playerName: string
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
}

interface FarmTask {
  scenario: string
  challenge: string
  choices: string[]
  correctIndex: number
  explanation: string
  xpReward: number
  coinReward: number
}

const FALLBACK_TASKS: FarmTask[] = [
  {
    scenario: "Your family wants to sell eggs at the farmer's market. You have 4 hens. Each hen lays about 5 eggs per week. Eggs sell for $0.50 each.",
    challenge: "How much money could you earn in one week?",
    choices: ["$5.00", "$8.00", "$10.00", "$20.00"],
    correctIndex: 2,
    explanation: "4 hens × 5 eggs = 20 eggs per week. 20 eggs × $0.50 = $10.00. Running a farm stand teaches you real math AND entrepreneurship!",
    xpReward: 30,
    coinReward: 10
  },
  {
    scenario: "Your garden has 3 rows of tomatoes. Each row has 8 plants. You want to can all your tomatoes. Each plant gives about 10 tomatoes and each jar needs 6 tomatoes.",
    challenge: "How many jars can you fill?",
    choices: ["24 jars", "40 jars", "48 jars", "30 jars"],
    correctIndex: 1,
    explanation: "3 rows × 8 plants = 24 plants. 24 plants × 10 tomatoes = 240 tomatoes. 240 ÷ 6 = 40 jars. Preserving your harvest is a real survival skill!",
    xpReward: 35,
    coinReward: 12
  },
]

export default function HomesteadFarm({ playerName, onXpEarned, onCoinsEarned }: Props) {
  const [task, setTask] = useState<FarmTask | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [questIndex, setQuestIndex] = useState(0)

  useEffect(() => { loadTask() }, [questIndex])

  async function loadTask() {
    setLoading(true)
    setSelected(null)
    setRevealed(false)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a practical homesteading challenge for a homeschool student. It should involve farming, animals (chickens, sheep, horses, cows), gardening, canning/preserving food, building, selling at a farm stand, or off-grid living. Include real math or decision-making. Write 2 sentences setting the scene, then a multiple-choice question with 4 options. Respond ONLY with valid JSON: {"scenario":"...","challenge":"...","choices":["...","...","...","..."],"correctIndex":0,"explanation":"...","xpReward":30,"coinReward":10}`,
          history: []
        })
      })
      const data = await res.json()
      const parsed = JSON.parse(data.reply.replace(/```json|```/g, '').trim())
      if (parsed.scenario && parsed.choices?.length === 4) setTask(parsed)
      else throw new Error('bad format')
    } catch {
      setTask(FALLBACK_TASKS[questIndex % FALLBACK_TASKS.length])
    } finally {
      setLoading(false)
    }
  }

  function check() {
    if (selected === null || !task) return
    setRevealed(true)
    if (selected === task.correctIndex) {
      onXpEarned(task.xpReward)
      onCoinsEarned(task.coinReward)
    }
  }

  const isCorrect = revealed && selected === task?.correctIndex

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #1a2e0a 0%, #2d4a1a 40%, #3d5c1e 100%)' }}>
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <span className="text-3xl">🌾</span>
        <div>
          <h2 className="text-white font-bold text-lg">Homestead Farm</h2>
          <p className="text-lime-300 text-xs">Grow, raise, build, sell — {playerName}!</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 overflow-y-auto">
        {loading ? (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lime-300 text-sm">Adeline is checking the farm...</p>
          </div>
        ) : task ? (
          <>
            <div className="w-full max-w-lg bg-lime-900/30 backdrop-blur rounded-2xl p-5 border border-lime-400/20">
              <p className="text-xs text-lime-300 font-semibold uppercase tracking-wider mb-2">🐓 Farm Scene</p>
              <p className="text-white/90 text-sm leading-relaxed">{task.scenario}</p>
            </div>
            <div className="w-full max-w-lg">
              <p className="text-white font-semibold text-sm mb-3">{task.challenge}</p>
              <div className="space-y-2">
                {task.choices.map((choice, i) => {
                  let cls = 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  if (selected === i && !revealed) cls = 'bg-lime-600/40 border border-lime-400 text-white'
                  if (revealed && i === task.correctIndex) cls = 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-200'
                  if (revealed && selected === i && i !== task.correctIndex) cls = 'bg-red-500/30 border-2 border-red-400 text-red-200'
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
                className="w-full max-w-lg py-3 bg-lime-600 hover:bg-lime-500 disabled:opacity-50 text-white font-bold rounded-xl">
                Work It Out →
              </button>
            ) : (
              <div className={`w-full max-w-lg rounded-2xl p-4 space-y-2 ${isCorrect ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-red-500/20 border border-red-400'}`}>
                <p className={`font-bold ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>{isCorrect ? '🎉 Great farming!' : '🌱 Keep growing!'}</p>
                <p className="text-white/80 text-sm">{task.explanation}</p>
                {isCorrect && <p className="text-amber-300 text-xs">+{task.xpReward} XP · +{task.coinReward} AdeCoins</p>}
                <button onClick={() => setQuestIndex(i => i + 1)}
                  className={`w-full py-2 rounded-xl text-white font-semibold mt-2 ${isCorrect ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  Next Task →
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="flex justify-center gap-4 p-3 border-t border-white/10">
        {['🐔','🐑','🥕','🍅','🥚'].map((e,i) => <span key={i} className="text-xl opacity-40">{e}</span>)}
      </div>
    </div>
  )
}
