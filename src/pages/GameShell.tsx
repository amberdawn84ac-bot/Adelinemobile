import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Sparkles } from 'lucide-react'

export default function GameShell() {
  const { activeChild, guestSession, signOut, parentAccount } = useAuth()
  const navigate = useNavigate()

  const playerName = activeChild?.display_name || guestSession?.displayName || 'Explorer'
  const isGuest = !!guestSession && !activeChild

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
          <Sparkles className="w-10 h-10 text-amber-900" />
        </div>

        <div>
          <h1 className="text-3xl font-bold font-serif">Welcome to Adeline World</h1>
          <p className="text-emerald-300 mt-2">
            Hello, <span className="text-amber-300 font-semibold">{playerName}</span>!
            {isGuest && <span className="text-xs ml-2 bg-white/10 px-2 py-0.5 rounded-full">Guest</span>}
          </p>
        </div>

        <div className="bg-white/10 rounded-2xl p-6 space-y-2 text-sm text-left">
          <p className="text-emerald-300 font-semibold text-xs uppercase tracking-wider">Auth Status ✓</p>
          {activeChild && (
            <>
              <p>Player: {activeChild.display_name} (@{activeChild.username})</p>
              <p>XP: {activeChild.xp} · AdeCoins: {activeChild.ade_coins}</p>
              <p>Parent: {parentAccount?.display_name}</p>
            </>
          )}
          {isGuest && (
            <>
              <p>Guest mode — progress saved locally</p>
              <p className="text-amber-300">Create an account to save to cloud & make friends!</p>
            </>
          )}
          <p className="text-emerald-400 text-xs mt-4">
            ✓ Foundation complete — game world coming in Plan 2
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all mx-auto"
        >
          <LogOut className="w-4 h-4" />
          {isGuest ? 'Leave Game' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
