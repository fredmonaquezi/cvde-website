import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../components/toast/useToast'
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
  const { examCatalog, orders, faqEntries, isLoading, loadError, reload } = useVetDashboardData()
  const toast = useToast()
  const registrationComplete = isVetRegistrationComplete(profile)

  useEffect(() => {
    if (loadError) {
      toast.error(loadError)
    }
  }, [loadError, toast])

  const handleOrderCreated = async () => {
    setActiveTab('history')
    await reload()
  }

  const doctorName = formatDoctorName(profile.full_name)

  return (
    <main className="page">
      <section className="card">
        <div className="shell-header">
          <div className="brand-line">
            <h1 className="brand-title">CVDE Platform</h1>
          </div>
          <div className="header-actions">
            <button
              className={activeTab === 'profile' ? 'profile-trigger active' : 'profile-trigger'}
              type="button"
              onClick={() => setActiveTab('profile')}
            >
              <span className="profile-avatar" aria-hidden="true">
                {(profile.full_name?.trim().charAt(0) || 'D').toUpperCase()}
              </span>
              Profile
            </button>
            <button className="secondary" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>

        <h2 className="welcome-title">Welcome, {doctorName}</h2>

        {!registrationComplete ? (
          <VetRegistrationGate onProfileUpdated={onProfileUpdated} profile={profile} session={session} />
        ) : (
          <>
            <div className="tab-row">
              <button className={activeTab === 'home' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('home')}>
                Home
              </button>
              <button className={activeTab === 'order' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('order')}>
                Order a Vet Exam
              </button>
              <button className={activeTab === 'history' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('history')}>
                My Exam History
              </button>
              <button className={activeTab === 'prices' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('prices')}>
                Updated Value Table
              </button>
              <button className={activeTab === 'faq' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('faq')}>
                Technical Questions
              </button>
            </div>

            {isLoading ? <p className="muted">Loading data...</p> : null}

            {!isLoading && activeTab === 'home' ? <VetHomeSection onNavigate={setActiveTab} /> : null}

            {!isLoading && activeTab === 'order' ? (
              <VetOrderSection
                examCatalog={examCatalog}
                onOrderCreated={handleOrderCreated}
                profile={profile}
                session={session}
              />
            ) : null}

            {!isLoading && activeTab === 'history' ? <VetHistorySection orders={orders} /> : null}

            {!isLoading && activeTab === 'prices' ? <VetPricesSection examCatalog={examCatalog} /> : null}

            {!isLoading && activeTab === 'faq' ? <VetFaqSection faqEntries={faqEntries} /> : null}

            {!isLoading && activeTab === 'profile' ? (
              <VetProfileSection onProfileUpdated={onProfileUpdated} profile={profile} session={session} />
            ) : null}
          </>
        )}
      </section>
    </main>
  )
}
