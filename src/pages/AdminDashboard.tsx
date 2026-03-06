import { useEffect, useState } from 'react'
import BrandLockup from '../components/BrandLockup'
import { useToast } from '../components/toast/useToast'
import AdminExamValuesSection from '../features/admin/components/AdminExamValuesSection'
import AdminFaqSection from '../features/admin/components/AdminFaqSection'
import AdminHistorySection from '../features/admin/components/AdminHistorySection'
import AdminOrdersSection from '../features/admin/components/AdminOrdersSection'
import { useAdminDashboardData } from '../hooks/useAdminDashboardData'
import { useI18n } from '../i18n'
import type { AdminTab, Profile } from '../types/app'

type AdminDashboardProps = {
  profile: Profile
  onSignOut: () => Promise<void>
}

export default function AdminDashboard({ profile, onSignOut }: AdminDashboardProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<AdminTab>('orders')
  const { examCatalog, orders, faqEntries, driverPhone, isLoading, loadError, reload } = useAdminDashboardData()
  const toast = useToast()
  const adminTabs: Array<{ id: AdminTab; label: string; description: string }> = [
    {
      id: 'orders',
      label: t('adminDashboard.tab.orders.label'),
      description: t('adminDashboard.tab.orders.description'),
    },
    {
      id: 'history',
      label: t('adminDashboard.tab.history.label'),
      description: t('adminDashboard.tab.history.description'),
    },
    {
      id: 'prices',
      label: t('adminDashboard.tab.prices.label'),
      description: t('adminDashboard.tab.prices.description'),
    },
    {
      id: 'faq',
      label: t('adminDashboard.tab.faq.label'),
      description: t('adminDashboard.tab.faq.description'),
    },
  ]

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
          <BrandLockup compact subtitle={t('adminDashboard.brand.subtitle')} />
          <div className="header-actions">
            <div className="profile-trigger">
              <span className="profile-avatar" aria-hidden="true">
                {(profile.full_name?.trim().charAt(0) || 'A').toUpperCase()}
              </span>
              {profile.full_name ?? t('adminDashboard.profileFallback')}
            </div>
            <button className="secondary" type="button" onClick={onSignOut}>
              {t('common.signOut')}
            </button>
          </div>
        </div>

        <div className="hero-grid">
          <section className="hero-panel">
            <p className="eyebrow">{t('adminDashboard.hero.eyebrow')}</p>
            <h1 className="hero-title">{t('adminDashboard.hero.title')}</h1>
            <p className="hero-copy">{t('adminDashboard.hero.copy')}</p>
          </section>

          <div className="hero-stats">
            <article className="hero-stat">
              <span className="stat-label">{t('adminDashboard.stats.openOrders.label')}</span>
              <strong>{openOrdersCount}</strong>
              <span className="stat-copy">{t('adminDashboard.stats.openOrders.copy')}</span>
            </article>
            <article className="hero-stat">
              <span className="stat-label">{t('adminDashboard.stats.collectionQueue.label')}</span>
              <strong>{collectionQueueCount}</strong>
              <span className="stat-copy">{t('adminDashboard.stats.collectionQueue.copy')}</span>
            </article>
            <article className="hero-stat">
              <span className="stat-label">{t('adminDashboard.stats.activeExams.label')}</span>
              <strong>{activeExamCount}</strong>
              <span className="stat-copy">{t('adminDashboard.stats.activeExams.copy')}</span>
            </article>
          </div>
        </div>

        <div className="dashboard-nav-grid" role="tablist" aria-label={t('adminDashboard.nav.aria')}>
          {adminTabs.map((tab) => (
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
      </section>
    </main>
  )
}
