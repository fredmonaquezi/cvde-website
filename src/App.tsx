import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'

type UserRole = 'vet_user' | 'admin_user'

type Profile = {
  id: string
  full_name: string | null
  role: UserRole
}

function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (error) {
        setMessage(error.message)
      } else if (!data.session) {
        setMessage('Account created. Check your email to confirm login.')
      } else {
        setMessage('Account created and logged in.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Login successful.')
      }
    }

    setLoading(false)
  }

  return (
    <main className="page">
      <section className="card auth-card">
        <h1>CVDE Platform</h1>
        <p className="muted">
          {mode === 'login' ? 'Login to continue.' : 'Create your vet account.'}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Auth mode">
          <button
            className={mode === 'login' ? 'tab active' : 'tab'}
            type="button"
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={mode === 'signup' ? 'tab active' : 'tab'}
            type="button"
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label>
              Full name
              <input
                required
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Dr. Jane Smith"
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@clinic.com"
            />
          </label>

          <label>
            Password
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
            />
          </label>

          <button disabled={loading} type="submit">
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>

        {message ? <p className="message">{message}</p> : null}
      </section>
    </main>
  )
}

function VetDashboard({ profile, onSignOut }: { profile: Profile; onSignOut: () => Promise<void> }) {
  return (
    <main className="page">
      <section className="card">
        <div className="card-header">
          <h1>Vet Portal</h1>
          <button className="secondary" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
        <p className="muted">Welcome, {profile.full_name ?? 'Doctor'}.</p>

        <div className="feature-grid">
          <article className="feature">
            <h2>Order a Vet Exam</h2>
            <p>Create and send a new exam request to CVDE administration.</p>
          </article>
          <article className="feature">
            <h2>My Exam History</h2>
            <p>View only your own exam requests, values, and status updates.</p>
          </article>
          <article className="feature">
            <h2>Updated Value Table</h2>
            <p>See latest exam values published by CVDE administration.</p>
          </article>
          <article className="feature">
            <h2>Technical Questions</h2>
            <p>Read FAQ and support guidance for exams and clinic processes.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

function AdminDashboard({ profile, onSignOut }: { profile: Profile; onSignOut: () => Promise<void> }) {
  return (
    <main className="page">
      <section className="card">
        <div className="card-header">
          <h1>CVDE Admin Portal</h1>
          <button className="secondary" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
        <p className="muted">Logged in as {profile.full_name ?? 'Administrator'}.</p>

        <div className="feature-grid">
          <article className="feature">
            <h2>Incoming Exam Orders</h2>
            <p>Review all vet requests and schedule exams in the CVDE clinic.</p>
          </article>
          <article className="feature">
            <h2>Price Management</h2>
            <p>Update official exam values shown to all vet users.</p>
          </article>
          <article className="feature">
            <h2>Global History Access</h2>
            <p>See all exam order history across all veterinarian accounts.</p>
          </article>
          <article className="feature">
            <h2>Technical FAQ Management</h2>
            <p>Publish and update answers in the technical question section.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

function MissingProfile({ onSignOut }: { onSignOut: () => Promise<void> }) {
  return (
    <main className="page">
      <section className="card">
        <h1>Profile Not Ready</h1>
        <p className="muted">
          Your account exists, but your role profile is missing. Ask CVDE admin to run the database setup SQL.
        </p>
        <button type="button" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </main>
  )
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data as Profile
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) {
        return
      }

      const currentSession = data.session
      setSession(currentSession)

      if (currentSession?.user) {
        const nextProfile = await fetchProfile(currentSession.user.id)
        if (mounted) {
          setProfile(nextProfile)
        }
      } else {
        setProfile(null)
      }

      if (mounted) {
        setIsLoading(false)
      }
    }

    void initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (!nextSession?.user) {
        setProfile(null)
        return
      }

      void fetchProfile(nextSession.user.id).then((nextProfile) => {
        setProfile(nextProfile)
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const defaultPath = useMemo(() => {
    if (!session) {
      return '/login'
    }

    if (profile?.role === 'admin_user') {
      return '/admin'
    }

    return '/app'
  }, [profile?.role, session])

  if (isLoading) {
    return (
      <main className="page">
        <section className="card">
          <h1>Loading...</h1>
        </section>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to={defaultPath} replace /> : <AuthPage />} />

      <Route
        path="/app"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : !profile ? (
            <MissingProfile onSignOut={signOut} />
          ) : profile.role === 'vet_user' ? (
            <VetDashboard profile={profile} onSignOut={signOut} />
          ) : (
            <Navigate to="/admin" replace />
          )
        }
      />

      <Route
        path="/admin"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : !profile ? (
            <MissingProfile onSignOut={signOut} />
          ) : profile.role === 'admin_user' ? (
            <AdminDashboard profile={profile} onSignOut={signOut} />
          ) : (
            <Navigate to="/app" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  )
}

export default App
