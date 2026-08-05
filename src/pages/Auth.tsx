import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft } from 'lucide-react'

function sanitizeUsername(val: string) {
  return val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
}

function sanitizePin(val: string) {
  return val.replace(/[^0-9]/g, '').slice(0, 4)
}

export default function Auth() {
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [gradeLevel, setGradeLevel] = useState('K-2')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (pin.length !== 4) { setError('PIN must be 4 digits.'); return }
    setIsLoading(true)
    try {
      if (mode === 'signup') {
        if (username.length < 3) { setError('Username must be at least 3 characters.'); setIsLoading(false); return }
        await signUp(displayName.trim(), username, pin, gradeLevel)
      } else {
        await signIn(username, pin)
      }
      navigate('/game')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-amber-50 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold font-serif text-slate-800">
            {mode === 'signup' ? 'Create Your Account' : 'Sign In'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                placeholder="First name or nickname"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(sanitizeUsername(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-mono"
              placeholder="coolkid_123"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              required
              value={pin}
              onChange={e => setPin(sanitizePin(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-mono tracking-widest"
              placeholder="••••"
              maxLength={4}
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade Level</label>
              <select
                value={gradeLevel}
                onChange={e => setGradeLevel(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 bg-white"
              >
                <option value="K-2">Kindergarten–2nd Grade</option>
                <option value="3-5">3rd–5th Grade</option>
                <option value="6-8">6th–8th Grade</option>
                <option value="9-12">9th–12th Grade (High School)</option>
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
          >
            {isLoading ? 'Please wait...' : mode === 'signup' ? 'Create Account →' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }}
            className="text-amber-700 font-semibold hover:underline"
          >
            {mode === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  )
}
