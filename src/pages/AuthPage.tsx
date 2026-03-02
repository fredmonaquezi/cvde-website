import { useState } from 'react'
import type { FormEvent } from 'react'
import BrandLockup from '../components/BrandLockup'
import { useToast } from '../components/toast/useToast'
import { signInWithEmailPassword, signUpVetAccount } from '../services/authService'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await signUpVetAccount({
        email,
        password,
        fullName,
        emailRedirectTo: window.location.origin,
      })

      if (error) {
        toast.error(error)
      } else if (data?.needsEmailConfirmation) {
        toast.info('Account created. Check your email to confirm login.')
      } else {
        toast.success('Account created and logged in.')
      }
    } else {
      const { error } = await signInWithEmailPassword(email, password)

      if (error) {
        toast.error(error)
      } else {
        toast.success('Login successful.')
      }
    }

    setLoading(false)
  }

  return (
    <main className="page">
      <section className="card auth-shell">
        <aside className="auth-brand-panel">
          <BrandLockup
            eyebrow="Modern diagnostic workflow"
            subtitle="Built for fast intake, clear pricing, and simpler daily operations."
          />
          <h1 className="hero-title">A cleaner way to manage veterinary exams.</h1>
          <p className="hero-copy">
            The platform is now organized as focused bento-style workspaces, so the next action is always easy to find.
          </p>

          <div className="mini-bento-grid">
            <article className="mini-bento-card">
              <p className="eyebrow">Orders</p>
              <h2>Fast exam intake</h2>
              <p className="muted">Submit requests with a clearer flow for patient, owner, and exam selection.</p>
            </article>
            <article className="mini-bento-card">
              <p className="eyebrow">Pricing</p>
              <h2>Visible value tables</h2>
              <p className="muted">Keep current pricing easy to review before each order is sent.</p>
            </article>
            <article className="mini-bento-card">
              <p className="eyebrow">Support</p>
              <h2>One place for answers</h2>
              <p className="muted">Technical questions, operational help, and profile details stay in one interface.</p>
            </article>
          </div>
        </aside>

        <section className="auth-form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{mode === 'login' ? 'Access your workspace' : 'Create your account'}</p>
              <h2>{mode === 'login' ? 'Sign in' : 'Join CVDE'}</h2>
            </div>
            <p className="muted">
              {mode === 'login'
                ? 'Use your registered email to continue.'
                : 'Create a veterinarian login and complete your profile after access.'}
            </p>
          </div>

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
        </section>
      </section>
    </main>
  )
}
