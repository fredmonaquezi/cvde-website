import type { VetTab } from '../../../types/app'

type VetHomeSectionProps = {
  onNavigate: (tab: VetTab) => void
}

export default function VetHomeSection({ onNavigate }: VetHomeSectionProps) {
  return (
    <section className="section">
      <div className="landing-grid">
        <article className="landing-card">
          <h3>Order a Vet Exam</h3>
          <p>Create a new exam request with owner, patient, and selected exam details.</p>
          <button className="secondary" type="button" onClick={() => onNavigate('order')}>
            Open Order Form
          </button>
        </article>

        <article className="landing-card">
          <h3>My Exam History</h3>
          <p>Review your previous requests, values, and scheduling status updates.</p>
          <button className="secondary" type="button" onClick={() => onNavigate('history')}>
            View History
          </button>
        </article>

        <article className="landing-card">
          <h3>Updated Value Table</h3>
          <p>See current official prices published by CVDE administration.</p>
          <button className="secondary" type="button" onClick={() => onNavigate('prices')}>
            Open Value Table
          </button>
        </article>

        <article className="landing-card">
          <h3>Technical Questions</h3>
          <p>Access FAQ guidance on exams, values, and platform operations.</p>
          <button className="secondary" type="button" onClick={() => onNavigate('faq')}>
            Open FAQ
          </button>
        </article>
      </div>
    </section>
  )
}
