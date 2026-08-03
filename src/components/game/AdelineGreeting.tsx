// src/components/game/AdelineGreeting.tsx
import { useState, useEffect } from 'react'
import { streamConversation } from '../../lib/brainClient'

interface Props {
  studentId: string | null
  playerName: string
  gradeBand: string
  onDismiss: () => void
}

export default function AdelineGreeting({ studentId, playerName, gradeBand, onDismiss }: Props) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!studentId) {
      setText(`Well, hello there, ${playerName}! The town is ready for you. Go explore!`)
      setDone(true)
      return
    }

    const controller = new AbortController()

    streamConversation(
      {
        student_id: studentId,
        message: '__GREETING__',
        grade_level: gradeBand,
        conversation_history: [],
      },
      (delta) => setText(prev => prev + delta),
      () => setDone(true),
      (err) => {
        setText(`Morning, ${playerName}! The town is yours today. Go see what calls to you.`)
        setDone(true)
        console.warn('Greeting stream error:', err)
      },
      controller.signal,
    )

    return () => controller.abort()
  }, [studentId, playerName, gradeBand])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 pointer-events-none">
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border-2 border-amber-300 p-5 max-w-md w-full pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-amber-400 shrink-0 shadow-lg">
            <img
              src="/adeline_portrait.png"
              alt="Adeline"
              className="w-full h-full object-cover"
              onError={e => {
                e.currentTarget.style.display = 'none'
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.backgroundColor = '#D97706'
                  e.currentTarget.parentElement.innerHTML =
                    '<span style="color:white;font-size:22px;display:flex;align-items:center;justify-content:center;height:100%">A</span>'
                }
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 mb-1">Adeline</p>
            <p className="text-slate-700 text-sm leading-relaxed min-h-[48px]">
              {text || <span className="text-slate-300 animate-pulse">...</span>}
            </p>
          </div>
        </div>

        {done && (
          <button
            onClick={onDismiss}
            className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm py-2.5 rounded-2xl transition-all"
          >
            Let's go!
          </button>
        )}
      </div>
    </div>
  )
}
