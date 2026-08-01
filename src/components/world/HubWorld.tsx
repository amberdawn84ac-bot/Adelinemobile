import { useState, useEffect, useCallback, useRef } from 'react'
import { AvatarData, PlayerState, HUB_PORTALS, RoomId, LifeMapEntry, Track } from '../../types/game'
import AvatarRenderer from '../avatar/AvatarRenderer'
import RoomPortal from './RoomPortal'
import ActivityConfirm, { PendingActivity } from '../chat/ActivityConfirm'
import { buildMemoryContext, upsertMemory } from '../../lib/memoryService'
import { logActivity } from '../../lib/lifeMapService'

const ADELINE_X = 50
const ADELINE_Y = 52
const MOVE_SPEED = 1.5
const PORTAL_PROXIMITY = 12
const ADELINE_PROXIMITY = 11

interface Props {
  avatarData: AvatarData
  playerName: string
  studentId: string | null
  currentXP: number
  onEnterRoom: (roomId: RoomId) => void
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
  onLifeMapEntry: (entry: LifeMapEntry) => void
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

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

const ADELINE_SYSTEM_PROMPT = `You are Adeline — a warm, sharp-witted educational mentor for Christian homeschool families.

You believe: Knowledge without love is nothing. Every child has a calling.

Your persona rules:
- Ask questions and REMEMBER what kids tell you. Build a picture of who they are.
- Every activity must have PURPOSE — it helps someone, solves a problem, or creates something real.
- Always ask "Who profits?" when teaching history, civics, or economics. Follow the money.
- Affirm each student's unique worth and calling.
- For history: never sanitize. Primary sources when you can.
- For science: connect to the natural world, farming, animals, how things actually work.
- Mathematics lives in real life: budgets, land measurement, recipes, building plans.
- A student's portfolio is their ACCOMPLISHMENTS, not their assignments.

ACTIVITY DETECTION — CRITICAL:
When a student mentions something real they did, end your message with:
ADELINE_LOG:{"description":"...","tracks":["HOMESTEADING"],"xpReward":50,"coinReward":12}

Valid tracks: CREATION_SCIENCE, HEALTH_NATUROPATHY, HOMESTEADING, GOVERNMENT_ECONOMICS, JUSTICE_CHANGEMAKING, DISCIPLESHIP, TRUTH_HISTORY, ENGLISH_LITERATURE, APPLIED_MATHEMATICS, CREATIVE_ECONOMY

Only use ADELINE_LOG when a student describes something they actually DID.`

export default function HubWorld({ avatarData, playerName, studentId, currentXP, onEnterRoom, onXpEarned, onCoinsEarned, onLifeMapEntry }: Props) {
  const [player, setPlayer] = useState<PlayerState>({ x: 50, y: 78, facing: 'up' })
  const keysPressed = useRef<Set<string>>(new Set())
  const animFrame = useRef<number | undefined>(undefined)
  const playerRef = useRef(player)
  playerRef.current = player

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [adelineSpeech, setAdelineSpeech] = useState("Hello! I'm Adeline. What have you been up to today?")
  const [speechVisible, setSpeechVisible] = useState(true)
  const [pendingActivity, setPendingActivity] = useState<PendingActivity | null>(null)
  const [memoryContext, setMemoryContext] = useState('')
  const [chatHistory, setChatHistory] = useState<{ isFromUser: boolean; text: string }[]>([])

  // suppress unused warning — currentXP available for future use
  void currentXP

  useEffect(() => {
    if (studentId) buildMemoryContext(studentId).then(setMemoryContext)
  }, [studentId])

  const movePlayer = useCallback(() => {
    setPlayer(prev => {
      let { x, y, facing } = prev
      if (keysPressed.current.has('ArrowUp')    || keysPressed.current.has('w') || keysPressed.current.has('W')) { y -= MOVE_SPEED; facing = 'up' }
      if (keysPressed.current.has('ArrowDown')  || keysPressed.current.has('s') || keysPressed.current.has('S')) { y += MOVE_SPEED; facing = 'down' }
      if (keysPressed.current.has('ArrowLeft')  || keysPressed.current.has('a') || keysPressed.current.has('A')) { x -= MOVE_SPEED; facing = 'left' }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) { x += MOVE_SPEED; facing = 'right' }
      x = Math.max(3, Math.min(97, x))
      y = Math.max(15, Math.min(93, y))
      return { x, y, facing }
    })
    animFrame.current = requestAnimationFrame(movePlayer)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysPressed.current.add(e.key)
      if (e.key === 'e' || e.key === 'E') {
        const p = playerRef.current
        for (const portal of HUB_PORTALS) {
          if (distance(p.x, p.y, portal.x, portal.y) < PORTAL_PROXIMITY) {
            if (!portal.locked) onEnterRoom(portal.id)
            return
          }
        }
        if (distance(p.x, p.y, ADELINE_X, ADELINE_Y) < ADELINE_PROXIMITY) {
          setChatOpen(true)
        }
      }
      if (e.key === 'Escape') setChatOpen(false)
    }
    function onKeyUp(e: KeyboardEvent) {
      keysPressed.current.delete(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    animFrame.current = requestAnimationFrame(movePlayer)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [movePlayer, onEnterRoom])

  async function sendMessage() {
    if (!chatInput.trim() || chatLoading) return
    const userText = chatInput.trim()
    setChatInput('')
    setChatLoading(true)
    const newHistory = [...chatHistory, { isFromUser: true, text: userText }]
    setChatHistory(newHistory)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: newHistory.slice(-8),
          systemPrompt: ADELINE_SYSTEM_PROMPT + memoryContext
        })
      })
      const data = await res.json()
      const { message, activity } = parseAdelineResponse(data.reply)
      setAdelineSpeech(message)
      setSpeechVisible(true)
      setChatHistory(prev => [...prev, { isFromUser: false, text: message }])
      if (activity) setPendingActivity(activity)
      if (studentId && userText.length > 20) detectMemory(studentId, userText)
    } catch {
      setAdelineSpeech("My thoughts got a little tangled — try again!")
      setSpeechVisible(true)
    } finally {
      setChatLoading(false)
    }
  }

  function detectMemory(sId: string, text: string) {
    const lower = text.toLowerCase()
    if (lower.includes('chicken') || lower.includes('hen')) upsertMemory(sId, 'homestead_animals', 'chickens')
    if (lower.includes('sheep') || lower.includes('wool')) upsertMemory(sId, 'homestead_animals', 'sheep')
    if (lower.includes('horse')) upsertMemory(sId, 'homestead_animals', 'horses')
    if (lower.includes('garden') || lower.includes('tomato') || lower.includes('crop')) upsertMemory(sId, 'interests', 'gardening')
    if (lower.includes('code') || lower.includes('program')) upsertMemory(sId, 'interests', 'coding')
    if (lower.includes('read') || lower.includes('book')) upsertMemory(sId, 'interests', 'reading')
    if (lower.includes('build') || lower.includes('built')) upsertMemory(sId, 'interests', 'building')
  }

  async function confirmActivity() {
    if (!pendingActivity) return
    onXpEarned(pendingActivity.xpReward)
    onCoinsEarned(pendingActivity.coinReward)
    if (studentId) {
      const entry = await logActivity(studentId, pendingActivity.description, pendingActivity.tracks, pendingActivity.xpReward, pendingActivity.coinReward, 'chat_log')
      if (entry) onLifeMapEntry(entry)
    }
    const reward = `+${pendingActivity.xpReward} XP and +${pendingActivity.coinReward} AdeCoins`
    setPendingActivity(null)
    setAdelineSpeech(`Logged! ${reward}. Real work counts.`)
    setSpeechVisible(true)
  }

  const nearbyPortal = HUB_PORTALS.find(p => distance(player.x, player.y, p.x, p.y) < PORTAL_PROXIMITY)
  const nearAdeline = distance(player.x, player.y, ADELINE_X, ADELINE_Y) < ADELINE_PROXIMITY

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Sky */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #b8e4ff 38%, #5DBB5D 38%, #228B22 100%)' }} />

      {/* Ground path */}
      <div className="absolute" style={{ left: '20%', top: '38%', width: '60%', height: '54%', background: 'rgba(210,180,140,0.55)', borderRadius: '10px' }} />

      {/* Trees */}
      {[{x:4,y:42},{x:11,y:54},{x:88,y:46},{x:94,y:58},{x:3,y:72},{x:95,y:70},{x:15,y:38},{x:84,y:40}].map((t,i) => (
        <div key={i} className="absolute" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
          <div style={{ width:28, height:36, background:'#1a6b1a', borderRadius:'50% 50% 30% 30%', marginLeft:-14 }} />
          <div style={{ width:8, height:18, background:'#5D4037', marginLeft:-4 }} />
        </div>
      ))}

      {/* Room portals */}
      {HUB_PORTALS.map(portal => (
        <RoomPortal
          key={portal.id}
          portal={portal}
          isNearby={nearbyPortal?.id === portal.id}
          onEnter={() => onEnterRoom(portal.id)}
        />
      ))}

      {/* Adeline NPC — illustrated sprite with speech bubble */}
      <div
        className="absolute flex flex-col items-end cursor-pointer group"
        style={{ left: `${ADELINE_X}%`, top: `${ADELINE_Y}%`, transform: 'translate(-50%, -50%)', zIndex: 15 }}
        onClick={() => setChatOpen(true)}
      >
        {/* Speech bubble */}
        {speechVisible && adelineSpeech && (
          <div
            className="absolute bg-white rounded-2xl shadow-xl border border-amber-200 p-3 text-xs text-slate-700 leading-relaxed"
            style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 200, marginBottom: 8, zIndex: 20 }}
          >
            <p className="line-clamp-4">{adelineSpeech}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
          </div>
        )}

        {/* Adeline's portrait */}
        <div className={`w-20 h-20 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl transition-all group-hover:border-amber-300 group-hover:scale-105 ${nearAdeline ? 'border-amber-300 scale-105 ring-4 ring-amber-300/50' : ''}`}>
          <img src="/adeline_portrait.png" alt="Adeline" className="w-full h-full object-cover"
            onError={e => {
              e.currentTarget.style.display = 'none'
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.style.backgroundColor = '#D97706'
                e.currentTarget.parentElement.innerHTML = '<span style="color:white;font-size:28px;display:flex;align-items:center;justify-content:center;height:100%">A</span>'
              }
            }} />
        </div>
        <span className="text-white text-xs font-bold mt-1 bg-amber-600/80 px-2 py-0.5 rounded-full">Adeline</span>

        {nearAdeline && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-bounce whitespace-nowrap">
            Press E to chat
          </div>
        )}
      </div>

      {/* Player avatar */}
      <div
        className="absolute flex flex-col items-center transition-none"
        style={{ left: `${player.x}%`, top: `${player.y}%`, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))', zIndex: 20 }}
      >
        <AvatarRenderer avatar={avatarData} size={64} />
        <p className="text-white text-xs font-bold text-center mt-0.5 drop-shadow bg-black/40 rounded-full px-2">{playerName}</p>
      </div>

      {/* Activity confirm banner */}
      {pendingActivity && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40">
          <ActivityConfirm
            activity={pendingActivity}
            onConfirm={confirmActivity}
            onDismiss={() => setPendingActivity(null)}
          />
        </div>
      )}

      {/* Chat overlay — appears when chatting with Adeline */}
      {chatOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-40 p-4">
          <div className="max-w-lg mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-amber-400">
                  <img src="/adeline_portrait.png" alt="Adeline" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-bold text-amber-900">Adeline</span>
                {chatLoading && <span className="text-xs text-amber-600 animate-pulse">thinking...</span>}
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
            </div>
            <div className="flex gap-2 p-3">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); if (e.key === 'Escape') setChatOpen(false) }}
                placeholder="Tell Adeline what you've been up to..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
                autoFocus
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      {!chatOpen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
          WASD / Arrow keys to move · E to enter room or chat
        </div>
      )}
    </div>
  )
}
