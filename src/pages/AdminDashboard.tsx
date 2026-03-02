import { useEffect, useState } from 'react'
import BrandLockup from '../components/BrandLockup'
import { useToast } from '../components/toast/useToast'
import AdminExamValuesSection from '../features/admin/components/AdminExamValuesSection'
import AdminFaqSection from '../features/admin/components/AdminFaqSection'
import AdminHistorySection from '../features/admin/components/AdminHistorySection'
import AdminOrdersSection from '../features/admin/components/AdminOrdersSection'
import { useAdminDashboardData } from '../hooks/useAdminDashboardData'
import type { AdminTab, Profile } from '../types/app'

const ADMIN_TABS: Array<{ id: AdminTab; label: string; description: string }> = [
  {
    id: 'orders',
    label: 'Orders',
    description: 'Review and update all incoming requests.',
  },
  {
    id: 'history',
    label: 'History',
    description: 'Inspect performance and export filtered reports.',
  },
  {
    id: 'prices',
    label: 'Exam Values',
    description: 'Control pricing, names, categories, and status.',
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Maintain the answers shown to veterinarians.',
  },
]

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

  const openOrdersCount = orders.filter((order) => order.status !== 'completed' && order.status !== 'cancelled').length
  const collectionQueueCount = orders.filter((order) => order.request_collection && !order.sample_received_at).length
  const activeExamCount = examCatalog.filter((exam) => exam.active).length

  const renderActiveSection = () => {
    if (activeTab === 'orders') {
      return <AdminOrdersSection driverPhone={driverPhone} onDataChanged={reload} orders={orders} />
    }

    if (activeTab === 'history') {
      return <AdminHistorySection orders={orders} />
    }

    if (activeTab === 'prices') {
      return <AdminExamValuesSection examCatalog={examCatalog} onDataChanged={reload} />
    }

    return <AdminFaqSection faqEntries={faqEntries} onDataChanged={reload} />
  }

  return (
    <main className="page">
      <section className="card dashboard-card">
        <div className="shell-header">
          <BrandLockup compact subtitle="Admin console" />
          <div className="header-actions">
            <div className="profile-trigger">
              <span className="profile-avatar" aria-hidden="true">
                {(profile.full_name?.trim().charAt(0) || 'A').toUpperCase()}
              </span>
              {profile.full_name ?? 'Administrator'}
            </div>
            <button className="secondary" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>

        <div className="hero-grid">
          <section className="hero-panel">
            <p className="eyebrow">Operations overview</p>
            <h1 className="hero-title">Manage CVDE in one clean control room.</h1>
            <p className="hero-copy">
              Incoming orders, pricing controls, FAQ management, and reporting are grouped into clear operational blocks.
            </p>
          </section>

          <div className="hero-stats">
            <article className="hero-stat">
              <span className="stat-label">Open orders</span>
              <strong>{openOrdersCount}</strong>
              <span className="stat-copy">Requests still being processed</span>
            </article>
            <article className="hero-stat">
              <span className="stat-label">Collection queue</span>
              <strong>{collectionQueueCount}</strong>
              <span className="stat-copy">Requests awaiting sample receipt</span>
            </article>
            <article className="hero-stat">
              <span className="stat-label">Active exams</span>
              <strong>{activeExamCount}</strong>
              <span className="stat-copy">Exams visible to veterinarians</span>
            </article>
          </div>
        </div>

        <div className="dashboard-nav-grid" role="tablist" aria-label="Admin sections">
          {ADMIN_TABS.map((tab) => (
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
      </section>
    </main>
  )
}
