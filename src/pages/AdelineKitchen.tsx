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
    { role:'assistant', content:`You made it in, ${playerName}. Kettle's still warm. What did you find?` },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    const userMsg: Message = {role:'user',content:text}
    const assistantMsg: Message = {role:'assistant',content:'',streaming:true}
    setMessages(prev => [...prev,userMsg,assistantMsg])
    setStreaming(true)

    const history = [...messages.filter(m => !m.streaming).slice(-9),{role:'user' as const,content:text}]
      .map(m => ({role:m.role,content:m.content}))

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    await streamConversation(
      {student_id:studentId ?? 'guest',message:text,grade_level:gradeBand,conversation_history:history},
      delta => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') updated[updated.length - 1] = {...last,content:last.content + delta}
          return updated
        })
      },
      () => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') updated[updated.length - 1] = {...last,streaming:false}
          return updated
        })
        setStreaming(false)
      },
      err => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') updated[updated.length - 1] = {...last,content:'I lost that thread. Tell me the last part again.',streaming:false}
          return updated
        })
        setStreaming(false)
        console.warn('Kitchen stream error:',err)
      },
      controller.signal,
    )
  }

  useEffect(() => () => { abortRef.current?.abort() }, [])

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#d8cfba] text-[#302a24]">
      <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(#473b31 .6px, transparent .7px)',backgroundSize:'5px 5px'}} />
      <div className="absolute left-0 top-0 h-32 w-full bg-gradient-to-b from-[#705845]/20 to-transparent" />
      <div className="absolute -left-20 bottom-12 h-72 w-72 rounded-full bg-[#315d58]/8 blur-3xl" />
      <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#8d3451]/8 blur-3xl" />

      <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-[#44382f]/15 bg-[#efe5cf]/88 px-4 py-3 backdrop-blur-sm">
        <button onClick={onBack} className="rounded-full border border-[#41372e]/15 bg-[#fff8e9]/55 px-3 py-2 font-serif text-xs">← outside</button>
        <div className="h-11 w-11 overflow-hidden rounded-full border border-[#41372e]/20 bg-[#e2d3b6] shadow-md">
          <img
            src="/adeline_portrait.png"
            alt="Adeline"
            className="h-full w-full object-cover"
            onError={e => {
              e.currentTarget.style.display = 'none'
              if (e.currentTarget.parentElement) e.currentTarget.parentElement.innerHTML = '<span style="font-family:serif;font-size:18px;display:flex;align-items:center;justify-content:center;height:100%;color:#4b4036">A</span>'
            }}
          />
        </div>
        <div>
          <p className="font-serif text-sm">Adeline's kitchen</p>
          <p className="mt-0.5 font-serif text-[10px] italic text-[#786a59]">stove warm · back door open</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg,i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[86%] px-4 py-3 font-serif text-sm leading-6 shadow-sm ${
                  msg.role === 'user'
                    ? 'rounded-[18px_18px_6px_18px] border border-[#315d58]/20 bg-[#315d58] text-[#fff9ec]'
                    : 'rounded-[18px_18px_18px_6px] border border-[#463a30]/15 bg-[#f4ecd9]/92 text-[#433a31]'
                }`}
              >
                {msg.content || (msg.streaming ? <span className="italic text-[#897b68]">thinking…</span> : '')}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative z-10 shrink-0 border-t border-[#44382f]/15 bg-[#efe5cf]/92 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Tell Adeline what happened…"
            className="flex-1 rounded-full border border-[#493e33]/20 bg-[#fff9ec]/70 px-4 py-2.5 font-serif text-sm outline-none placeholder:text-[#8a7b68] focus:border-[#315d58]/45"
            autoFocus
            disabled={streaming}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="rounded-full border border-[#5f436a]/20 bg-[#654a7b] px-5 py-2.5 font-serif text-sm text-[#fff8e9] disabled:opacity-35"
          >
            tell her
          </button>
        </div>
      </div>
    </div>
  )
}
