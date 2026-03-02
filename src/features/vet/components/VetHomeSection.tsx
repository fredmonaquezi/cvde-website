import type { VetTab } from '../../../types/app'

type VetHomeSectionProps = {
  onNavigate: (tab: VetTab) => void
}

const HOME_ACTIONS: Array<{
  id: VetTab
  label: string
  description: string
  cta: string
  tone: string
}> = [
  {
    id: 'order',
    label: 'Order a Vet Exam',
    description: 'Create a new exam request with owner, patient, and selected exam details.',
    cta: 'Open Order Form',
    tone: 'Fast intake',
  },
  {
    id: 'history',
    label: 'My Exam History',
    description: 'Review previous requests, values, and scheduling status updates.',
    cta: 'View History',
    tone: 'Past requests',
  },
  {
    id: 'prices',
    label: 'Updated Value Table',
    description: 'See the current official prices published by CVDE administration.',
    cta: 'Open Value Table',
    tone: 'Latest pricing',
  },
  {
    id: 'faq',
    label: 'Technical Questions',
    description: 'Access FAQ guidance for exams, values, and platform operations.',
    cta: 'Open FAQ',
    tone: 'Quick answers',
  },
]

export default function VetHomeSection({ onNavigate }: VetHomeSectionProps) {
  return (
    <section className="section">
      <div className="landing-grid">
        {HOME_ACTIONS.map((action) => (
          <article className="landing-card" key={action.id}>
            <span className="landing-chip">{action.tone}</span>
            <div className="landing-card-copy">
              <h3>{action.label}</h3>
              <p>{action.description}</p>
            </div>
            <button className="secondary" type="button" onClick={() => onNavigate(action.id)}>
              {action.cta}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
