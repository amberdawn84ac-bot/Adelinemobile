import { useNavigate } from 'react-router-dom'
import OpenLearningVault from '../components/resources/OpenLearningVault'

export default function OpenLearningVaultPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-950">
      <OpenLearningVault onClose={() => navigate('/game')} />
    </div>
  )
}
