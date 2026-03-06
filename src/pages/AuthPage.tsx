import { useState } from 'react'
import type { FormEvent } from 'react'
import BrandLockup from '../components/BrandLockup'
import { useToast } from '../components/toast/useToast'
import { useI18n } from '../i18n'
import { signInWithEmailPassword, signUpVetAccount } from '../services/authService'

export default function AuthPage() {
  const { t } = useI18n()
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
        toast.info(t('auth.toast.accountCreatedCheckEmail'))
      } else {
        toast.success(t('auth.toast.accountCreatedAndSignedIn'))
      }
    } else {
      const { error } = await signInWithEmailPassword(email, password)

      if (error) {
        toast.error(error)
      } else {
        toast.success(t('auth.toast.loginSuccess'))
      }
    }

    setLoading(false)
  }

  return (
    <main className="page">
      <section className="card auth-shell">
        <aside className="auth-brand-panel">
          <BrandLockup eyebrow={t('auth.brand.eyebrow')} subtitle={t('auth.brand.subtitle')} />
          <h1 className="hero-title">{t('auth.hero.title')}</h1>
          <p className="hero-copy">{t('auth.hero.copy')}</p>

          <div className="mini-bento-grid">
            <article className="mini-bento-card">
              <p className="eyebrow">{t('auth.card.orders.eyebrow')}</p>
              <h2>{t('auth.card.orders.title')}</h2>
              <p className="muted">{t('auth.card.orders.copy')}</p>
            </article>
            <article className="mini-bento-card">
              <p className="eyebrow">{t('auth.card.pricing.eyebrow')}</p>
              <h2>{t('auth.card.pricing.title')}</h2>
              <p className="muted">{t('auth.card.pricing.copy')}</p>
            </article>
            <article className="mini-bento-card">
              <p className="eyebrow">{t('auth.card.support.eyebrow')}</p>
              <h2>{t('auth.card.support.title')}</h2>
              <p className="muted">{t('auth.card.support.copy')}</p>
            </article>
          </div>
        </aside>

        <section className="auth-form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{mode === 'login' ? t('auth.heading.loginEyebrow') : t('auth.heading.signupEyebrow')}</p>
              <h2>{mode === 'login' ? t('auth.heading.loginTitle') : t('auth.heading.signupTitle')}</h2>
            </div>
            <p className="muted">
              {mode === 'login' ? t('auth.heading.loginCopy') : t('auth.heading.signupCopy')}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label={t('auth.tabs.aria')}>
            <button
              className={mode === 'login' ? 'tab active' : 'tab'}
              type="button"
              onClick={() => setMode('login')}
            >
              {t('auth.tabs.login')}
            </button>
            <button
              className={mode === 'signup' ? 'tab active' : 'tab'}
              type="button"
              onClick={() => setMode('signup')}
            >
              {t('auth.tabs.signup')}
            </button>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            {mode === 'signup' ? (
              <label>
                {t('auth.form.fullName')}
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder={t('auth.form.fullNamePlaceholder')}
                />
              </label>
            ) : null}

            <label>
              {t('auth.form.email')}
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('auth.form.emailPlaceholder')}
              />
            </label>

            <label>
              {t('auth.form.password')}
              <input
                required
                minLength={6}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('auth.form.passwordPlaceholder')}
              />
            </label>

            <button disabled={loading} type="submit">
              {loading ? t('auth.form.submitLoading') : mode === 'login' ? t('auth.form.submitLogin') : t('auth.form.submitSignup')}
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}
