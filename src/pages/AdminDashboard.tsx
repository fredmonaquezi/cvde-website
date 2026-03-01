import { useEffect, useState } from 'react'
import { useToast } from '../components/toast/useToast'
import AdminExamValuesSection from '../features/admin/components/AdminExamValuesSection'
import AdminFaqSection from '../features/admin/components/AdminFaqSection'
import AdminHistorySection from '../features/admin/components/AdminHistorySection'
import AdminOrdersSection from '../features/admin/components/AdminOrdersSection'
import { useAdminDashboardData } from '../hooks/useAdminDashboardData'
import type { AdminTab, Profile } from '../types/app'

type AdminDashboardProps = {
  profile: Profile
  onSignOut: () => Promise<void>
}

export default function AdminDashboard({ profile, onSignOut }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders')
  const { examCatalog, orders, faqEntries, driverPhone, isLoading, loadError, reload } = useAdminDashboardData()
  const toast = useToast()

  useEffect(() => {
    if (loadError) {
      toast.error(loadError)
    }
  }, [loadError, toast])

  return (
    <main className="page">
      <section className="card">
        <div className="card-header">
          <div>
            <h1>CVDE Admin Portal</h1>
            <p className="muted">Logged in as {profile.full_name ?? 'Administrator'}.</p>
          </div>
          <button className="secondary" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>

        <div className="tab-row">
          <button className={activeTab === 'orders' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('orders')}>
            Incoming Orders
          </button>
          <button className={activeTab === 'history' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('history')}>
            History
          </button>
          <button className={activeTab === 'prices' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('prices')}>
            Exam Values
          </button>
          <button className={activeTab === 'faq' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('faq')}>
            FAQ Management
          </button>
        </div>

        {isLoading ? <p className="muted">Loading data...</p> : null}

        {!isLoading && activeTab === 'orders' ? (
          <AdminOrdersSection driverPhone={driverPhone} onDataChanged={reload} orders={orders} />
        ) : null}

        {!isLoading && activeTab === 'history' ? <AdminHistorySection orders={orders} /> : null}

        {!isLoading && activeTab === 'prices' ? (
          <AdminExamValuesSection examCatalog={examCatalog} onDataChanged={reload} />
        ) : null}

        {!isLoading && activeTab === 'faq' ? (
          <AdminFaqSection faqEntries={faqEntries} onDataChanged={reload} />
        ) : null}
      </section>
    </main>
  )
}
