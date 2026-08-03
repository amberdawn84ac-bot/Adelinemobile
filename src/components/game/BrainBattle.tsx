// src/components/game/BrainBattle.tsx
import { useState, useEffect, useRef } from 'react'
import { generateLesson, BrainLessonBlock } from '../../lib/brainClient'
import { Track, GradeBand } from '../../types/game'

function parseQuizBlock(block: BrainLessonBlock): { question: string; answer: string } | null {
  const qMatch = block.content.match(/Q:\s*(.+)/i)
  const aMatch = block.content.match(/A:\s*(.+)/i)
  if (!qMatch || !aMatch) return null
  return { question: qMatch[1].trim(), answer: aMatch[1].trim() }
}

interface Question {
  question: string
  answer: string
  userAnswer: string
  correct: boolean | null
}

interface Props {
  studentId: string | null
  track: Track
  gradeBand: GradeBand
  playerName: string
  onComplete: (xp: number, coins: number) => void
  onBack: () => void
}

const QUESTION_TIME = 30

export default function BrainBattle({ studentId, track, gradeBand, playerName, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<'loading' | 'playing' | 'results'>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [inputVal, setInputVal] = useState('')
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  void error

  useEffect(() => {
    loadQuestions()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function loadQuestions() {
    const lesson = await generateLesson({
      student_id: studentId ?? 'guest',
      track,
      topic: 'quiz_battle',
      is_homestead: true,
      grade_level: gradeBand,
      render_mode: 'standard_lesson',
    })

    const quizBlocks = lesson?.blocks.filter(b => b.type === 'QUIZ') ?? []
    const parsed = quizBlocks.map(parseQuizBlock).filter(Boolean) as { question: string; answer: string }[]

    if (parsed.length === 0) {
      setQuestions([
        { question: 'What does photosynthesis produce?', answer: 'oxygen and glucose', userAnswer: '', correct: null },
        { question: 'What is 7 × 8?', answer: '56', userAnswer: '', correct: null },
        { question: 'Name one primary source a historian might use.', answer: 'diary, letter, or newspaper from the time', userAnswer: '', correct: null },
      ])
    } else {
      setQuestions(parsed.map(q => ({ ...q, userAnswer: '', correct: null })))
    }
    setPhase('playing')
    startTimer()
  }

  function startTimer() {
    setTimeLeft(QUESTION_TIME)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitAnswer('')
          return QUESTION_TIME
        }
        return prev - 1
      })
    }, 1000)
  }

  function submitAnswer(val: string) {
    if (timerRef.current) clearInterval(timerRef.current)
    const answer = val.trim().toLowerCase()
    const correctAnswer = questions[currentIdx].answer.toLowerCase()
    const correct = answer.length > 0 && correctAnswer.includes(answer)

    setQuestions(prev => {
      const updated = [...prev]
      updated[currentIdx] = { ...updated[currentIdx], userAnswer: val, correct }
      return updated
    })
    setInputVal('')

    const nextIdx = currentIdx + 1
    if (nextIdx >= questions.length) {
      setPhase('results')
    } else {
      setCurrentIdx(nextIdx)
      startTimer()
    }
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-900 text-white gap-4">
        <div className="w-12 h-12 border-4 border-red-300 border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-bold">Preparing your battle...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-900 text-white gap-4 p-8">
        <p className="text-4xl">⚠️</p>
        <p className="text-center">{error}</p>
        <button onClick={onBack} className="px-6 py-3 bg-white text-red-900 font-bold rounded-2xl">
          Back to Town
        </button>
      </div>
    )
  }

  if (phase === 'results') {
    const correct = questions.filter(q => q.correct).length
    const total = questions.length
    const xp = correct * 25
    const coins = correct * 6
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-900 text-white gap-6 p-8">
        <p className="text-6xl">{correct === total ? '🏆' : correct > total / 2 ? '⭐' : '🎯'}</p>
        <h2 className="text-2xl font-black">{playerName}'s Results</h2>
        <div className="text-center">
          <p className="text-5xl font-black">{correct}/{total}</p>
          <p className="text-red-200 mt-1">questions correct</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-300">+{xp}</p>
            <p className="text-red-200 text-xs">XP</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-300">+{coins}</p>
            <p className="text-red-200 text-xs">AdeCoins</p>
          </div>
        </div>
        <div className="space-y-2 w-full max-w-sm">
          {questions.map((q, i) => (
            <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl ${q.correct ? 'bg-green-900/50' : 'bg-red-800/50'}`}>
              <span>{q.correct ? '✅' : '❌'}</span>
              <div className="text-sm">
                <p className="font-semibold text-white">{q.question}</p>
                {!q.correct && <p className="text-red-200 text-xs">Answer: {q.answer}</p>}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => onComplete(xp, coins)}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl text-lg transition-all"
        >
          Collect Rewards
        </button>
      </div>
    )
  }

  const q = questions[currentIdx]
  const timerPct = (timeLeft / QUESTION_TIME) * 100

  return (
    <div className="flex flex-col h-full bg-red-900 text-white">
      <div className="px-4 py-3 flex items-center justify-between border-b border-red-700">
        <button onClick={onBack} className="text-red-300 hover:text-white text-sm">← Exit</button>
        <span className="font-black text-lg">⚔️ Brain Battle</span>
        <span className="text-red-300 text-sm">{currentIdx + 1}/{questions.length}</span>
      </div>

      <div className="h-2 bg-red-800">
        <div
          className="h-full bg-amber-400 transition-all duration-1000"
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-center">
          <p className="text-red-300 text-sm font-semibold mb-2">{timeLeft}s remaining</p>
          <p className="text-2xl font-black leading-snug">{q.question}</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitAnswer(inputVal) }}
            placeholder="Your answer..."
            className="w-full px-4 py-3 rounded-2xl bg-red-800 border-2 border-red-600 text-white placeholder-red-400 focus:outline-none focus:border-amber-400 text-lg"
            autoFocus
          />
          <button
            onClick={() => submitAnswer(inputVal)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl text-lg transition-all"
          >
            Answer →
          </button>
          <button
            onClick={() => submitAnswer('')}
            className="w-full py-2 text-red-400 hover:text-red-200 text-sm transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
