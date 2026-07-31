import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles } from 'lucide-react'

export default function LandingPage() {
  const { startGuestSession } = useAuth()
  const navigate = useNavigate()
  const [guestName, setGuestName] = useState('')
  const [showGuestInput, setShowGuestInput] = useState(false)

  function handleGuestPlay() {
    if (!showGuestInput) { setShowGuestInput(true); return }
    if (!guestName.trim()) return
    startGuestSession(guestName.trim())
    navigate('/game')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-slate-800">Adeline World</h1>
          <p className="text-slate-500 text-sm">Learn. Build. Explore. Graduate.</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-3 px-4 bg-white hover:bg-amber-50 border-2 border-amber-200 text-amber-800 font-semibold rounded-xl transition-all"
          >
            Create Parent Account
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">or</span>
            </div>
          </div>

          {showGuestInput ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="What's your name?"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuestPlay()}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                autoFocus
              />
              <button
                onClick={handleGuestPlay}
                disabled={!guestName.trim()}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold rounded-xl transition-all"
              >
                Play as Guest →
              </button>
              <p className="text-xs text-slate-400 text-center">
                Guest progress saves in this browser only
              </p>
            </div>
          ) : (
            <button
              onClick={handleGuestPlay}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
            >
              Play as Guest (No Account Needed)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
