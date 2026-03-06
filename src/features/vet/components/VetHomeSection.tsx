import type { VetTab } from '../../../types/app'
import { useI18n } from '../../../i18n'

type VetHomeSectionProps = {
  onNavigate: (tab: VetTab) => void
}

const HOME_ACTIONS: Array<{
  id: VetTab
  key: string
}> = [
  {
    id: 'order',
    key: 'vetHome.actions.order',
  },
  {
    id: 'history',
    key: 'vetHome.actions.history',
  },
  {
    id: 'prices',
    key: 'vetHome.actions.prices',
  },
  {
    id: 'faq',
    key: 'vetHome.actions.faq',
  },
]

export default function VetHomeSection({ onNavigate }: VetHomeSectionProps) {
  const { t } = useI18n()

  return (
    <section className="section">
      <div className="landing-grid">
        {HOME_ACTIONS.map((action) => (
          <article className="landing-card" key={action.id}>
            <span className="landing-chip">{t(`${action.key}.tone`)}</span>
            <div className="landing-card-copy">
              <h3>{t(`${action.key}.label`)}</h3>
              <p>{t(`${action.key}.description`)}</p>
            </div>
            <button className="secondary" type="button" onClick={() => onNavigate(action.id)}>
              {t(`${action.key}.cta`)}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
