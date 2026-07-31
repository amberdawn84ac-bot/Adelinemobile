import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plus, LogOut, User } from 'lucide-react'

export default function ChildSelectPage() {
  const { children, setActiveChild, signOut, parentAccount } = useAuth()
  const navigate = useNavigate()

  function selectChild(child: typeof children[0]) {
    setActiveChild(child)
    navigate('/game')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-800">Who's playing?</h2>
            <p className="text-sm text-slate-500 mt-0.5">Hi {parentAccount?.display_name} 👋</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {children.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No kids added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => selectChild(child)}
                className="w-full flex items-center gap-4 p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl transition-all text-left"
              >
                <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{child.display_name}</p>
                  <p className="text-xs text-slate-500">@{child.username} · {child.xp} XP · {child.ade_coins} AdeCoins</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/create-child')}
          className="w-full py-3 border-2 border-dashed border-amber-200 hover:border-amber-400 text-amber-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Another Kid
        </button>
      </div>
    </div>
  )
}
