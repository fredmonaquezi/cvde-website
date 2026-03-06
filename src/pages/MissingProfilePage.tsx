import BrandLockup from '../components/BrandLockup'
import { useI18n } from '../i18n'

export default function MissingProfilePage({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const { t } = useI18n()

  return (
    <main className="page">
      <section className="card centered-panel">
        <BrandLockup compact eyebrow={t('missingProfile.eyebrow')} subtitle={t('missingProfile.subtitle')} />
        <div className="empty-state">
          <h1>{t('missingProfile.title')}</h1>
          <p className="muted">{t('missingProfile.copy')}</p>
        </div>
        <button type="button" onClick={onSignOut}>
          {t('common.signOut')}
        </button>
      </section>
    </main>
  )
}
