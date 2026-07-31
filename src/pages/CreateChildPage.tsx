import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Plus } from 'lucide-react'

export default function CreateChildPage() {
  const { addChild, setActiveChild, children } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function sanitizeUsername(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return }
    setIsLoading(true)
    try {
      const child = await addChild(displayName.trim(), username, parseInt(age) || 10)
      setActiveChild(child)
      navigate('/game')
    } catch (err: any) {
      if (err.message?.includes('unique')) {
        setError('That username is already taken. Try another one.')
      } else {
        setError(err.message || 'Could not create profile. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-slate-800">Add Your First Kid</h2>
          <p className="text-sm text-slate-500">You can add more kids from the parent dashboard later</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kid's Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              placeholder="First name or nickname"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username <span className="text-slate-400 font-normal">(shown to other players)</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(sanitizeUsername(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-mono"
              placeholder="coolkid_123"
              maxLength={20}
            />
            <p className="text-xs text-slate-400 mt-1">Letters, numbers, underscores only. You approve this before it goes live.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
            <input
              type="number"
              required
              min={4}
              max={18}
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              placeholder="10"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isLoading ? 'Creating...' : 'Create Profile & Enter World'}
          </button>
        </form>

        {children.length > 0 && (
          <button
            onClick={() => navigate('/select-child')}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Skip — choose an existing profile instead
          </button>
        )}
      </div>
    </div>
  )
}
