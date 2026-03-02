import { Navigate, Route, Routes } from 'react-router-dom'
import BrandLockup from './components/BrandLockup'
import { useAuthSession } from './hooks/useAuthSession'
import AuthPage from './pages/AuthPage'
import VetDashboard from './pages/VetDashboard'
import AdminDashboard from './pages/AdminDashboard'
import MissingProfilePage from './pages/MissingProfilePage'

function App() {
  const { session, profile, isLoading, signOut, setProfile, defaultPath } = useAuthSession()

  if (isLoading) {
    return (
      <main className="page">
        <section className="card centered-panel loading-card">
          <BrandLockup eyebrow="Preparing your workspace" subtitle="Secure access to exams, pricing, and operations." />
          <div aria-hidden="true" className="loading-indicator" />
          <p className="muted">Loading your dashboard.</p>
        </section>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate replace to={defaultPath} /> : <AuthPage />} />

      <Route
        path="/app"
        element={
          !session ? (
            <Navigate replace to="/login" />
          ) : !profile ? (
            <MissingProfilePage onSignOut={signOut} />
          ) : profile.role === 'vet_user' ? (
            <VetDashboard
              onProfileUpdated={(nextProfile) => setProfile(nextProfile)}
              onSignOut={signOut}
              profile={profile}
              session={session}
            />
          ) : (
            <Navigate replace to="/admin" />
          )
        }
      />

      <Route
        path="/admin"
        element={
          !session ? (
            <Navigate replace to="/login" />
          ) : !profile ? (
            <MissingProfilePage onSignOut={signOut} />
          ) : profile.role === 'admin_user' ? (
            <AdminDashboard onSignOut={signOut} profile={profile} />
          ) : (
            <Navigate replace to="/app" />
          )
        }
      />

      <Route element={<Navigate replace to={defaultPath} />} path="*" />
    </Routes>
  )
}

export default App
