import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AvatarData, RoomId, DEFAULT_AVATAR } from '../types/game'
import AvatarBuilder from '../components/avatar/AvatarBuilder'
import GameHUD from '../components/hud/GameHUD'
import HubWorld from '../components/world/HubWorld'
import MathMines from '../components/rooms/MathMines'
import StoryForest from '../components/rooms/StoryForest'
import ScienceLab from '../components/rooms/ScienceLab'
import HomesteadFarm from '../components/rooms/HomesteadFarm'
import TruthArchive from '../components/rooms/TruthArchive'
import { supabase } from '../lib/supabase'

type GameScreen = 'avatar_builder' | 'hub' | 'room'

function parseAvatar(data: Record<string, unknown>): AvatarData | null {
  if (!data || !data.skinTone) return null
  return data as unknown as AvatarData
}

const ROOM_LABELS: Record<RoomId, string> = {
  math_mines:     '⛏️ Math Mines',
  story_forest:   '🌲 Story Forest',
  science_lab:    '🔬 Science Lab',
  homestead_farm: '🌾 Homestead Farm',
  truth_archive:  '📜 Truth Archive',
}

export default function GameShell() {
  const { activeChild, guestSession, signOut, parentAccount } = useAuth()
  const navigate = useNavigate()

  const storedAvatar = activeChild?.avatar_data ? parseAvatar(activeChild.avatar_data as Record<string, unknown>) : null
  const guestAvatarRaw = guestSession?.avatarData
  const guestAvatar = guestAvatarRaw && Object.keys(guestAvatarRaw).length > 0
    ? parseAvatar(guestAvatarRaw as Record<string, unknown>)
    : null

  const hasAvatar = storedAvatar !== null || guestAvatar !== null
  const [screen, setScreen] = useState<GameScreen>(hasAvatar ? 'hub' : 'avatar_builder')
  const [avatarData, setAvatarData] = useState<AvatarData>(storedAvatar ?? guestAvatar ?? DEFAULT_AVATAR)
  const [currentRoom, setCurrentRoom] = useState<RoomId | null>(null)
  const [localXP, setLocalXP] = useState(activeChild?.xp ?? guestSession?.xp ?? 0)
  const [localCoins, setLocalCoins] = useState(activeChild?.ade_coins ?? guestSession?.adeCoins ?? 0)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ text: string; fromAdeline: boolean }[]>([
    { text: "Welcome to Adeline World! What would you like to explore today?", fromAdeline: true }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const playerName = activeChild?.display_name ?? guestSession?.displayName ?? 'Explorer'
  const isGuest = !activeChild && !!guestSession

  // suppress unused variable warning
  void parentAccount

  async function saveAvatar(avatar: AvatarData) {
    setAvatarData(avatar)
    if (activeChild) {
      await supabase
        .from('aw_student_profiles')
        .update({ avatar_data: avatar as unknown as Record<string, unknown> })
        .eq('id', activeChild.id)
    } else if (guestSession) {
      const updated = { ...guestSession, avatarData: avatar }
      localStorage.setItem('adeline_guest', JSON.stringify(updated))
    }
    setScreen('hub')
  }

  async function addXP(amount: number) {
    const newXP = localXP + amount
    setLocalXP(newXP)
    if (activeChild) {
      await supabase.from('aw_student_profiles').update({ xp: newXP }).eq('id', activeChild.id)
    }
  }

  async function addCoins(amount: number) {
    const newCoins = localCoins + amount
    setLocalCoins(newCoins)
    if (activeChild) {
      await supabase.from('aw_student_profiles').update({ ade_coins: newCoins }).eq('id', activeChild.id)
    }
  }

  const enterRoom = useCallback((roomId: RoomId) => {
    setCurrentRoom(roomId)
    setScreen('room')
  }, [])

  function exitRoom() {
    setCurrentRoom(null)
    setScreen('hub')
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { text: userMsg, fromAdeline: false }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: [] })
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { text: data.reply, fromAdeline: true }])
    } catch {
      setChatMessages(prev => [...prev, { text: "My thoughts got a little tangled — try again!", fromAdeline: true }])
    } finally {
      setChatLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const roomLabel = currentRoom ? ROOM_LABELS[currentRoom] : undefined
  const hudPlayer = activeChild ? { ...activeChild, xp: localXP, ade_coins: localCoins } : null
  const hudGuest = guestSession ? { ...guestSession, xp: localXP, adeCoins: localCoins } : null

  return (
    <div className="w-screen h-screen overflow-hidden relative">

      {screen === 'avatar_builder' && (
        <AvatarBuilder
          initialAvatar={storedAvatar ?? guestAvatar ?? undefined}
          playerName={playerName}
          onSave={saveAvatar}
        />
      )}

      {(screen === 'hub' || screen === 'room') && (
        <>
          <GameHUD
            player={hudPlayer}
            guestSession={hudGuest}
            avatarData={avatarData}
            roomLabel={roomLabel}
            onExitRoom={screen === 'room' ? exitRoom : undefined}
            onSignOut={handleSignOut}
          />

          <div className="w-full h-full pt-16">
            {screen === 'hub' && (
              <HubWorld
                avatarData={avatarData}
                playerName={playerName}
                onEnterRoom={enterRoom}
                onChatAdeline={() => setChatOpen(true)}
              />
            )}
            {screen === 'room' && currentRoom === 'math_mines' && (
              <MathMines playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />
            )}
            {screen === 'room' && currentRoom === 'story_forest' && (
              <StoryForest playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />
            )}
            {screen === 'room' && currentRoom === 'science_lab' && (
              <ScienceLab playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />
            )}
            {screen === 'room' && currentRoom === 'homestead_farm' && (
              <HomesteadFarm playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />
            )}
            {screen === 'room' && currentRoom === 'truth_archive' && (
              <TruthArchive playerName={playerName} onXpEarned={addXP} onCoinsEarned={addCoins} />
            )}
          </div>

          {isGuest && (
            <div className="fixed bottom-4 right-4 bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-lg max-w-xs">
              💾 Guest mode — progress not saved to cloud.{' '}
              <button onClick={handleSignOut} className="underline">Create account</button>
            </div>
          )}
        </>
      )}

      {chatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-amber-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
                  <img src="/adeline_portrait.png" alt="Adeline" className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display='none' }} />
                </div>
                <div>
                  <p className="text-white font-bold">Adeline</p>
                  <p className="text-amber-200 text-xs">Your learning guide</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-amber-50/30">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.fromAdeline ? '' : 'justify-end'}`}>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${msg.fromAdeline ? 'bg-white text-slate-800 border border-amber-100' : 'bg-amber-600 text-white'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-1 items-center px-4 py-2 bg-white rounded-2xl w-fit">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-amber-100 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask Adeline anything..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
              />
              <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
