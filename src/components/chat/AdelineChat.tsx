import { useState, useEffect, useRef } from 'react'
import { Track, LifeMapEntry } from '../../types/game'
import ActivityConfirm, { PendingActivity } from './ActivityConfirm'
import { buildMemoryContext, upsertMemory } from '../../lib/memoryService'
import { logActivity } from '../../lib/lifeMapService'

interface ChatMessage {
  id: string
  text: string
  fromAdeline: boolean
  timestamp: string
}

interface Props {
  studentId: string | null
  playerName: string
  currentXP: number
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
  onLifeMapEntry: (entry: LifeMapEntry) => void
}

const ADELINE_SYSTEM_PROMPT = `You are Adeline — a warm, sharp-witted educational mentor for Christian homeschool families.

You believe: Knowledge without love is nothing. Every child has a calling.

Your persona rules:
- Ask questions and REMEMBER what kids tell you. Build a picture of who they are.
- Every activity must have PURPOSE — it helps someone, solves a problem, or creates something real.
- Always ask "Who profits?" when teaching history, civics, or economics. Follow the money.
- Affirm each student's unique worth and calling.
- For history: never sanitize. Show what really happened. Primary sources when you can.
- For science: connect to the natural world, farming, animals, how things actually work.
- Mathematics lives in real life: budgets, land measurement, recipes, building plans.
- A student's portfolio is their ACCOMPLISHMENTS, not their assignments.

ACTIVITY DETECTION — CRITICAL:
When a student mentions something real they did (canned tomatoes, read a book, helped build something, practiced math, took care of animals, researched something, wrote something, cooked a meal, etc.), you MUST:
1. Ask follow-up questions to understand the scope and learning
2. Then end your message with a special JSON block on its own line:

ADELINE_LOG:{"description":"...what they did in their own words...","tracks":["HOMESTEADING","APPLIED_MATHEMATICS"],"xpReward":50,"coinReward":12}

Valid track values: CREATION_SCIENCE, HEALTH_NATUROPATHY, HOMESTEADING, GOVERNMENT_ECONOMICS, JUSTICE_CHANGEMAKING, DISCIPLESHIP, TRUTH_HISTORY, ENGLISH_LITERATURE, APPLIED_MATHEMATICS, CREATIVE_ECONOMY

Choose tracks that actually match what they did. XP reward should reflect depth and effort (20-100). Be generous but honest.

Do NOT output the ADELINE_LOG block for casual chat, greetings, questions, or anything not related to a real learning activity. Only use it when a student describes something they actually DID.`

function parseAdelineResponse(reply: string): { message: string; activity: PendingActivity | null } {
  const logMatch = reply.match(/ADELINE_LOG:(\{.*?\})/s)
  if (!logMatch) return { message: reply, activity: null }

  const message = reply.replace(/ADELINE_LOG:\{.*?\}/s, '').trim()
  try {
    const parsed = JSON.parse(logMatch[1])
    return {
      message,
      activity: {
        description: parsed.description,
        tracks: parsed.tracks as Track[],
        xpReward: parsed.xpReward ?? 30,
        coinReward: parsed.coinReward ?? 8,
      }
    }
  } catch {
    return { message: reply, activity: null }
  }
}

export default function AdelineChat({ studentId, playerName, currentXP, onXpEarned, onCoinsEarned, onLifeMapEntry }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingActivity, setPendingActivity] = useState<PendingActivity | null>(null)
  const [memoryContext, setMemoryContext] = useState('')
  const [initialized, setInitialized] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingActivity])

  useEffect(() => {
    initChat()
  }, [studentId])

  async function initChat() {
    let ctx = ''
    if (studentId) {
      ctx = await buildMemoryContext(studentId)
      setMemoryContext(ctx)
    }

    const hour = new Date().getHours()
    const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[SYSTEM: This is the student's greeting message. Greet them warmly as ${playerName}. Ask them what they've been up to, what they're curious about, or what they worked on today. Keep it short — 2-3 sentences. Time of day: ${timeGreet}.${ctx}]`,
          history: [],
          systemPrompt: ADELINE_SYSTEM_PROMPT
        })
      })
      const data = await res.json()
      const { message } = parseAdelineResponse(data.reply)
      setMessages([{
        id: '0',
        text: message,
        fromAdeline: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } catch {
      setMessages([{
        id: '0',
        text: `Good to see you, ${playerName}! What have you been up to today?`,
        fromAdeline: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: userText,
      fromAdeline: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const history = messages.slice(-10).map(m => ({
      isFromUser: !m.fromAdeline,
      text: m.text
    }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history,
          systemPrompt: ADELINE_SYSTEM_PROMPT + memoryContext
        })
      })
      const data = await res.json()
      const { message, activity } = parseAdelineResponse(data.reply)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: message,
        fromAdeline: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])

      if (activity) setPendingActivity(activity)

      if (studentId && userText.length > 20) {
        detectAndSaveMemory(studentId, userText)
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "My thoughts got a little tangled — try again!",
        fromAdeline: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setLoading(false)
    }
  }

  async function detectAndSaveMemory(sId: string, text: string) {
    const lower = text.toLowerCase()
    if (lower.includes('chicken') || lower.includes('hen') || lower.includes('egg'))
      upsertMemory(sId, 'homestead_animals', 'chickens/hens')
    if (lower.includes('sheep') || lower.includes('wool'))
      upsertMemory(sId, 'homestead_animals', 'sheep')
    if (lower.includes('horse') || lower.includes('equestrian'))
      upsertMemory(sId, 'homestead_animals', 'horses')
    if (lower.includes('garden') || lower.includes('plant') || lower.includes('tomato') || lower.includes('crop'))
      upsertMemory(sId, 'interests', 'gardening/farming')
    if (lower.includes('code') || lower.includes('program') || lower.includes('app'))
      upsertMemory(sId, 'interests', 'coding/programming')
    if (lower.includes('read') || lower.includes('book'))
      upsertMemory(sId, 'interests', 'reading')
    if (lower.includes('build') || lower.includes('built') || lower.includes('wood'))
      upsertMemory(sId, 'interests', 'building/woodworking')
  }

  async function confirmActivity() {
    if (!pendingActivity) return
    const xp = pendingActivity.xpReward
    const coins = pendingActivity.coinReward
    onXpEarned(xp)
    onCoinsEarned(coins)

    if (studentId) {
      const entry = await logActivity(studentId, pendingActivity.description, pendingActivity.tracks, xp, coins, 'chat_log')
      if (entry) onLifeMapEntry(entry)
    }

    setPendingActivity(null)
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: `Logged! That goes right onto your Life Map. +${xp} XP and +${coins} AdeCoins for you. Keep it up — real work counts.`,
      fromAdeline: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!initialized && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 max-w-2xl ${msg.fromAdeline ? '' : 'ml-auto flex-row-reverse'}`}>
            {msg.fromAdeline && (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0 mt-1">
                <img src="/adeline_portrait.png" alt="Adeline" className="w-full h-full object-cover"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.style.backgroundColor = '#D97706'
                      e.currentTarget.parentElement.innerHTML = '<span style="color:white;font-size:16px;display:flex;align-items:center;justify-content:center;height:100%">A</span>'
                    }
                  }} />
              </div>
            )}
            <div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-sm ${
                msg.fromAdeline
                  ? 'bg-white text-slate-800 border border-amber-100 rounded-tl-sm'
                  : 'bg-amber-600 text-white rounded-tr-sm'
              }`}>
                {msg.text}
              </div>
              <p className={`text-[10px] text-slate-400 mt-1 px-1 ${msg.fromAdeline ? '' : 'text-right'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-2xl">
            <div className="w-9 h-9 rounded-full bg-amber-600 flex-shrink-0 flex items-center justify-center mt-1">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center shadow-sm">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {pendingActivity && (
        <ActivityConfirm
          activity={pendingActivity}
          onConfirm={confirmActivity}
          onDismiss={() => setPendingActivity(null)}
        />
      )}

      <div className="p-4 bg-white border-t border-amber-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Tell Adeline what you've been up to..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-sm bg-slate-50/50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-5 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
