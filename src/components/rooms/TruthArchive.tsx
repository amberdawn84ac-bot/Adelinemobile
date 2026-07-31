import { useState, useEffect } from 'react'

interface Props {
  playerName: string
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
}

interface HistoryQuest {
  source: string
  sourceLabel: string
  question: string
  choices: string[]
  correctIndex: number
  explanation: string
  followMoney?: string
  xpReward: number
  coinReward: number
}

const FALLBACK_QUESTS: HistoryQuest[] = [
  {
    source: `"I have no accurate knowledge of my age, never having seen any authentic record containing it. By far the larger part of the slaves know as little of their ages as horses know of theirs."`,
    sourceLabel: "Frederick Douglass — Narrative of the Life of Frederick Douglass, 1845",
    question: "Why did enslaved people often not know their own ages?",
    choices: ["They didn't care about birthdays", "Enslavers deliberately withheld basic personal information as a tool of control", "Record-keeping was too expensive", "It was a cultural tradition to not track ages"],
    correctIndex: 1,
    explanation: "Douglass explains that keeping enslaved people ignorant of even basic facts about themselves — like their own birthday — was a deliberate strategy to strip away identity and humanity.",
    followMoney: "Enslavers profited from keeping people in ignorance. An enslaved person who didn't know their own history had fewer tools to resist or escape.",
    xpReward: 40,
    coinReward: 12
  },
  {
    source: `"We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness."`,
    sourceLabel: "Declaration of Independence — Thomas Jefferson, July 4, 1776",
    question: "What does 'unalienable Rights' mean in this context?",
    choices: ["Rights that can be taken away by the government", "Rights that only apply to property owners", "Rights that cannot be taken away because they come from God, not government", "Rights granted by a king or queen"],
    correctIndex: 2,
    explanation: "The founders argued that rights like life and liberty come from the Creator — not from any human government. That means no government has the authority to take them away.",
    followMoney: "Ask: if all men are created equal, who was excluded in 1776? Enslaved people, women, and those without property couldn't vote. The gap between the ideal and the reality is where history gets honest.",
    xpReward: 35,
    coinReward: 10
  },
]

export default function TruthArchive({ playerName, onXpEarned, onCoinsEarned }: Props) {
  const [quest, setQuest] = useState<HistoryQuest | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [showFollowMoney, setShowFollowMoney] = useState(false)
  const [loading, setLoading] = useState(true)
  const [questIndex, setQuestIndex] = useState(0)

  useEffect(() => { loadQuest() }, [questIndex])

  async function loadQuest() {
    setLoading(true)
    setSelected(null)
    setRevealed(false)
    setShowFollowMoney(false)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a primary source history question for a homeschool student. Use a real quote or paraphrase from an actual historical document, letter, speech, or record (label the source). The content should be honest and unfiltered — never sanitize history. Include a "follow the money" or "who profits?" insight when relevant. Topics: American founding, civil rights, westward expansion, Biblical history, colonial life, or world history. Respond ONLY with valid JSON: {"source":"...","sourceLabel":"...","question":"...","choices":["...","...","...","..."],"correctIndex":0,"explanation":"...","followMoney":"...","xpReward":35,"coinReward":10}`,
          history: []
        })
      })
      const data = await res.json()
      const parsed = JSON.parse(data.reply.replace(/```json|```/g, '').trim())
      if (parsed.source && parsed.choices?.length === 4) setQuest(parsed)
      else throw new Error('bad format')
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
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #1a0e05 0%, #2d1a08 50%, #3d240a 100%)' }}>
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <span className="text-3xl">📜</span>
        <div>
          <h2 className="text-white font-bold text-lg">Truth Archive</h2>
          <p className="text-amber-300 text-xs">Primary sources only, {playerName}. No sanitizing.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 overflow-y-auto">
        {loading ? (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-amber-300 text-sm">Adeline is opening the archives...</p>
          </div>
        ) : quest ? (
          <>
            <div className="w-full max-w-lg bg-amber-950/60 backdrop-blur rounded-2xl p-5 border border-amber-600/40">
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2">📖 Primary Source</p>
              <blockquote className="text-amber-100 text-sm leading-relaxed italic border-l-2 border-amber-500 pl-3">
                "{quest.source}"
              </blockquote>
              <p className="text-amber-500 text-xs mt-2">— {quest.sourceLabel}</p>
            </div>
            <div className="w-full max-w-lg">
              <p className="text-white font-semibold text-sm mb-3">{quest.question}</p>
              <div className="space-y-2">
                {quest.choices.map((choice, i) => {
                  let cls = 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  if (selected === i && !revealed) cls = 'bg-amber-700/40 border border-amber-400 text-white'
                  if (revealed && i === quest.correctIndex) cls = 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-200'
                  if (revealed && selected === i && i !== quest.correctIndex) cls = 'bg-red-500/30 border-2 border-red-400 text-red-200'
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
                className="w-full max-w-lg py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl">
                Submit Answer →
              </button>
            ) : (
              <div className={`w-full max-w-lg rounded-2xl p-4 space-y-3 ${isCorrect ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-red-500/20 border border-red-400'}`}>
                <p className={`font-bold ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>{isCorrect ? '🎉 You read the source!' : '📚 Read it again!'}</p>
                <p className="text-white/80 text-sm">{quest.explanation}</p>
                {isCorrect && <p className="text-amber-300 text-xs">+{quest.xpReward} XP · +{quest.coinReward} AdeCoins</p>}
                {quest.followMoney && (
                  <button onClick={() => setShowFollowMoney(v => !v)} className="text-xs text-amber-400 underline">
                    💰 Follow the money →
                  </button>
                )}
                {showFollowMoney && quest.followMoney && (
                  <div className="bg-amber-900/40 border border-amber-600/40 rounded-xl p-3">
                    <p className="text-amber-200 text-xs">{quest.followMoney}</p>
                  </div>
                )}
                <button onClick={() => setQuestIndex(i => i + 1)}
                  className={`w-full py-2 rounded-xl text-white font-semibold mt-1 ${isCorrect ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  Next Source →
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className="flex justify-center gap-4 p-3 border-t border-white/10">
        {['📜','🖋️','🗺️','⚖️','🏛️'].map((e,i) => <span key={i} className="text-xl opacity-40">{e}</span>)}
      </div>
    </div>
  )
}
