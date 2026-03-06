import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../components/toast/useToast'
import VetContactSection from '../features/vet/components/VetContactSection'
import VetFaqSection from '../features/vet/components/VetFaqSection'
import VetHistorySection from '../features/vet/components/VetHistorySection'
import VetHomeSection from '../features/vet/components/VetHomeSection'
import VetOrderSection from '../features/vet/components/VetOrderSection'
import VetPricesSection from '../features/vet/components/VetPricesSection'
import VetProfileSection from '../features/vet/components/VetProfileSection'
import VetRegistrationGate from '../features/vet/components/VetRegistrationGate'
import { useVetDashboardData } from '../hooks/useVetDashboardData'
import { useI18n } from '../i18n'
import type { Profile, VetTab } from '../types/app'
import { formatDoctorName } from '../utils/format'
import { isVetRegistrationComplete } from '../utils/profile'

type VetDashboardProps = {
  profile: Profile
  session: Session
  onSignOut: () => Promise<void>
  onProfileUpdated: (nextProfile: Profile) => void
}

export default function VetDashboard({
  profile,
  session,
  onSignOut,
  onProfileUpdated,
}: VetDashboardProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<VetTab>('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { examCatalog, orders, faqEntries, isLoading, loadError, reload } = useVetDashboardData()
  const toast = useToast()
  const registrationComplete = isVetRegistrationComplete(profile)
  const vetTabs: Array<{ id: VetTab; label: string; description: string }> = [
    {
      id: 'home',
      label: t('vetDashboard.tab.home.label'),
      description: t('vetDashboard.tab.home.description'),
    },
    {
      id: 'order',
      label: t('vetDashboard.tab.order.label'),
      description: t('vetDashboard.tab.order.description'),
    },
    {
      id: 'history',
      label: t('vetDashboard.tab.history.label'),
      description: t('vetDashboard.tab.history.description'),
    },
    {
      id: 'prices',
      label: t('vetDashboard.tab.prices.label'),
      description: t('vetDashboard.tab.prices.description'),
    },
    {
      id: 'faq',
      label: t('vetDashboard.tab.faq.label'),
      description: t('vetDashboard.tab.faq.description'),
    },
  ]

  useEffect(() => {
    if (loadError) {
      toast.error(loadError)
    }
  }, [loadError, toast])

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  const handleOrderCreated = async () => {
    setActiveTab('history')
    await reload()
  }

  const doctorName = formatDoctorName(profile.full_name)

  const handleOpenProfile = () => {
    setActiveTab('profile')
    setIsMenuOpen(false)
  }

  const handleSignOut = async () => {
    setIsMenuOpen(false)
    await onSignOut()
  }

  const renderActiveSection = () => {
    if (activeTab === 'home') {
      return <VetHomeSection onNavigate={setActiveTab} />
    }

    if (activeTab === 'order') {
      return (
        <VetOrderSection
          examCatalog={examCatalog}
          onOrderCreated={handleOrderCreated}
          profile={profile}
          session={session}
        />
      )
    }

    if (activeTab === 'history') {
      return <VetHistorySection orders={orders} />
    }

    if (activeTab === 'prices') {
      return <VetPricesSection examCatalog={examCatalog} />
    }

    if (activeTab === 'faq') {
      return <VetFaqSection faqEntries={faqEntries} />
    }

    return <VetProfileSection onProfileUpdated={onProfileUpdated} profile={profile} session={session} />
  }

  return (
    <main className="page">
      <section className="card dashboard-card">
        <div className="shell-header">
          <div className="shell-header-main">
            {registrationComplete ? (
              <div className="header-copy">
                <p className="eyebrow">{t('vetDashboard.header.eyebrow')}</p>
                <h1 className="header-title">{t('vetDashboard.header.welcome', { doctorName })}</h1>
                <p className="muted">{t('vetDashboard.header.copy')}</p>
              </div>
            ) : null}
          </div>
          <div className="header-actions">
            <div className="header-menu" ref={menuRef}>
              <button
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                className={isMenuOpen ? 'profile-trigger active' : 'profile-trigger'}
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <span className="profile-avatar" aria-hidden="true">
                  {(profile.full_name?.trim().charAt(0) || 'V').toUpperCase()}
                </span>
                {doctorName}
                <span aria-hidden="true" className={isMenuOpen ? 'profile-caret open' : 'profile-caret'}>
                  {isMenuOpen ? '˄' : '˅'}
                </span>
              </button>

              {isMenuOpen ? (
                <div className="header-menu-panel" role="menu">
                  {registrationComplete ? (
                    <button className="menu-item" role="menuitem" type="button" onClick={handleOpenProfile}>
                      {t('common.profile')}
                    </button>
                  ) : null}
                  <button className="menu-item" role="menuitem" type="button" onClick={() => void handleSignOut()}>
                    {t('common.signOut')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {registrationComplete ? (
          <>
            <div className="dashboard-nav-grid" role="tablist" aria-label={t('vetDashboard.nav.aria')}>
              {vetTabs.map((tab) => (
                <button
                  className={activeTab === tab.id ? 'nav-tile active' : 'nav-tile'}
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="nav-title">{tab.label}</span>
                  <span className="nav-description">{tab.description}</span>
                </button>
              ))}
            </div>

            {isLoading ? <p className="muted">{t('common.loadingData')}</p> : null}

            {!isLoading ? <section className="content-panel">{renderActiveSection()}</section> : null}
          </>
        ) : (
          <>
            <div className="hero-grid">
              <section className="hero-panel">
                <p className="eyebrow">{t('vetDashboard.registration.eyebrow')}</p>
                <h1 className="hero-title">{t('vetDashboard.registration.title')}</h1>
                <p className="hero-copy">{t('vetDashboard.registration.copy')}</p>
              </section>

              <div className="hero-stats">
                <article className="hero-stat">
                  <span className="stat-label">{t('vetDashboard.registration.account.label')}</span>
                  <strong>{t('vetDashboard.registration.account.value')}</strong>
                  <span className="stat-copy">{t('vetDashboard.registration.account.copy')}</span>
                </article>
                <article className="hero-stat">
                  <span className="stat-label">{t('vetDashboard.registration.profile.label')}</span>
                  <strong>{t('vetDashboard.registration.profile.value')}</strong>
                  <span className="stat-copy">{t('vetDashboard.registration.profile.copy')}</span>
                </article>
                <article className="hero-stat">
                  <span className="stat-label">{t('vetDashboard.registration.nextStep.label')}</span>
                  <strong>{t('vetDashboard.registration.nextStep.value')}</strong>
                  <span className="stat-copy">{t('vetDashboard.registration.nextStep.copy')}</span>
                </article>
              </div>
            </div>

            <section className="content-panel">
              <VetRegistrationGate onProfileUpdated={onProfileUpdated} profile={profile} session={session} />
            </section>
          </>
        )}

        <VetContactSection />
      </section>
    </main>
  )
}
