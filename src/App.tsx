import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Auth from './pages/Auth'
import GameShell from './pages/GameShell'
import OpenLearningVaultPage from './pages/OpenLearningVaultPage'
import LibraryShelf from './pages/LibraryShelf'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, guestSession, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  const isLoggedIn = user || guestSession
  return isLoggedIn ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/game" element={
          <RequireAuth><GameShell /></RequireAuth>
        } />
        <Route path="/open-learning-vault" element={
          <RequireAuth><OpenLearningVaultPage /></RequireAuth>
        } />
        <Route path="/library" element={
          <RequireAuth><LibraryShelf /></RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
