import { useNavigate } from 'react-router-dom'
import CreekInvestigation from '../components/adventures/CreekInvestigation'
import { useAuth } from '../context/AuthContext'
import { patchCoins, patchXP } from '../lib/brainClient'
import { logActivity } from '../lib/lifeMapService'
import { Track } from '../types/game'

export default function AdventureCreek() {
  const navigate = useNavigate()
  const { user, guestSession } = useAuth()
  const playerName = user?.display_name ?? guestSession?.displayName ?? 'Explorer'

  async function complete(description: string, tracks: Track[], xp: number, coins: number) {
    if (user) {
      await Promise.all([
        patchXP(user.id, xp),
        patchCoins(user.id, coins),
        logActivity(user.id, description, tracks, xp, coins, 'adeline_adventure'),
      ])
    } else if (guestSession) {
      const updated = {
        ...guestSession,
        xp: guestSession.xp + xp,
        adeCoins: guestSession.adeCoins + coins,
      }
      localStorage.setItem('adeline_guest', JSON.stringify(updated))
    }
  }

  return (
    <CreekInvestigation
      playerName={playerName}
      onBack={() => navigate('/game')}
      onComplete={complete}
    />
  )
}
