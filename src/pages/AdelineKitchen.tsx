// src/pages/AdelineKitchen.tsx
import { useState, useRef, useEffect } from 'react'
import { streamConversation } from '../lib/brainClient'
import { GradeBand } from '../types/game'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface Props {
  studentId: string | null
  playerName: string
  gradeBand: GradeBand
  onBack: () => void
}

export default function AdelineKitchen({ studentId, playerName, gradeBand, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Come on in, ${playerName}. Pull up a chair. What's on your mind?`,
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: Message = { role: 'user', content: text }
    const assistantMsg: Message = { role: 'assistant', content: '', streaming: true }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    // Build history including the message we're about to send
    const history = [
      ...messages.filter(m => !m.streaming).slice(-9),
      { role: 'user' as const, content: text },
    ].map(m => ({ role: m.role, content: m.content }))

    // Cancel any in-flight stream before starting a new one
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    await streamConversation(
      {
        student_id: studentId ?? 'guest',
        message: text,
        grade_level: gradeBand,
        conversation_history: history,
      },
      (delta) => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + delta }
          }
          return updated
        })
      },
      () => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, streaming: false }
          }
          return updated
        })
        setStreaming(false)
      },
      (err) => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: "My thoughts got a little tangled — try again in a moment.",
              streaming: false,
            }
          }
          return updated
        })
        setStreaming(false)
        console.warn('Kitchen stream error:', err)
      },
      controller.signal,
    )
  }

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  return (
    <div className="flex flex-col h-full bg-amber-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-amber-100 shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          ←
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow">
          <img
            src="/adeline_portrait.png"
            alt="Adeline"
            className="w-full h-full object-cover"
            onError={e => {
              e.currentTarget.style.display = 'none'
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.style.backgroundColor = '#D97706'
                e.currentTarget.parentElement.innerHTML =
                  '<span style="color:white;font-size:16px;display:flex;align-items:center;justify-content:center;height:100%">A</span>'
              }
            }}
          />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Adeline's Kitchen</p>
          <p className="text-xs text-amber-600">Always home, always listening</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-white rounded-br-sm'
                  : 'bg-white text-slate-700 border border-amber-100 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content || (msg.streaming ? <span className="animate-pulse text-slate-300">...</span> : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-amber-100 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Talk to Adeline..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
            autoFocus
            disabled={streaming}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold rounded-2xl text-sm transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
