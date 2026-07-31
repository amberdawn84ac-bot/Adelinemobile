import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CreateChildPage from './pages/CreateChildPage'
import ChildSelectPage from './pages/ChildSelectPage'
import GameShell from './pages/GameShell'
import ParentDashboard from './pages/ParentDashboard'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, guestSession, activeChild, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  const isLoggedIn = (session && activeChild) || guestSession
  return isLoggedIn ? <>{children}</> : <Navigate to="/" replace />
}

function RequireParent({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth()
  if (isLoading) return null
  return session ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/select-child" element={
          <RequireParent><ChildSelectPage /></RequireParent>
        } />
        <Route path="/create-child" element={
          <RequireParent><CreateChildPage /></RequireParent>
        } />
        <Route path="/game" element={
          <RequireAuth><GameShell /></RequireAuth>
        } />
        <Route path="/parent-dashboard" element={
          <RequireParent><ParentDashboard /></RequireParent>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
