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
import type { Profile, VetTab } from '../types/app'
import { formatDoctorName } from '../utils/format'
import { isVetRegistrationComplete } from '../utils/profile'

const VET_TABS: Array<{ id: VetTab; label: string; description: string }> = [
  {
    id: 'home',
    label: 'Overview',
    description: 'Start from the main action center.',
  },
  {
    id: 'order',
    label: 'Order Exam',
    description: 'Create a new request with all exam details.',
  },
  {
    id: 'history',
    label: 'History',
    description: 'Track previous requests and status updates.',
  },
  {
    id: 'prices',
    label: 'Values',
    description: 'Review the latest active value table.',
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Read technical guidance and answers.',
  },
]

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
  const [activeTab, setActiveTab] = useState<VetTab>('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { examCatalog, orders, faqEntries, isLoading, loadError, reload } = useVetDashboardData()
  const toast = useToast()
  const registrationComplete = isVetRegistrationComplete(profile)

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
                <p className="eyebrow">Veterinary workspace</p>
                <h1 className="header-title">Welcome, {doctorName}</h1>
                <p className="muted">
                  Orders, pricing, profile settings, and support are organized below in clear action blocks.
                </p>
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
                  {(profile.full_name?.trim().charAt(0) || 'D').toUpperCase()}
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
                      Profile
                    </button>
                  ) : null}
                  <button className="menu-item" role="menuitem" type="button" onClick={() => void handleSignOut()}>
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {registrationComplete ? (
          <>
            <div className="dashboard-nav-grid" role="tablist" aria-label="Veterinary sections">
              {VET_TABS.map((tab) => (
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

            {isLoading ? <p className="muted">Loading data...</p> : null}

            {!isLoading ? <section className="content-panel">{renderActiveSection()}</section> : null}
          </>
        ) : (
          <>
            <div className="hero-grid">
              <section className="hero-panel">
                <p className="eyebrow">One step before access</p>
                <h1 className="hero-title">Complete your registration</h1>
                <p className="hero-copy">
                  Finish your professional profile once so the full ordering workspace becomes available.
                </p>
              </section>

              <div className="hero-stats">
                <article className="hero-stat">
                  <span className="stat-label">Account</span>
                  <strong>Ready</strong>
                  <span className="stat-copy">Your login is active</span>
                </article>
                <article className="hero-stat">
                  <span className="stat-label">Profile</span>
                  <strong>Pending</strong>
                  <span className="stat-copy">Professional fields still required</span>
                </article>
                <article className="hero-stat">
                  <span className="stat-label">Next step</span>
                  <strong>Now</strong>
                  <span className="stat-copy">Complete the form below to continue</span>
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
