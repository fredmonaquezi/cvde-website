import { useState } from 'react'
import type { FormEvent } from 'react'
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
      <section className="card auth-card">
        <h1>CVDE Platform</h1>
        <p className="muted">
          {mode === 'login' ? 'Login to continue.' : 'Create your veterinarian account.'}
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
      </section>
    </main>
  )
}
