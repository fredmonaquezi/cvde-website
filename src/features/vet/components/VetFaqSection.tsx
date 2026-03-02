import type { FaqEntry } from '../../../types/app'

type VetFaqSectionProps = {
  faqEntries: FaqEntry[]
}

export default function VetFaqSection({ faqEntries }: VetFaqSectionProps) {
  return (
    <section className="section">
      <div className="faq-section-intro">
        <h2>Technical Questions</h2>
        <p className="muted">Find quick answers about permissions, pricing, scheduling, and daily platform usage.</p>
      </div>

      <div className="faq-list faq-list-spacious">
        {faqEntries.length === 0 ? <p className="faq-empty-state">No FAQ entries yet.</p> : null}
        {faqEntries.map((entry) => (
          <article className="faq-item faq-item-rich" key={entry.id}>
            <div className="faq-item-top">
              <span className="faq-category-pill">{entry.category ?? 'General'}</span>
            </div>
            <h3 className="faq-question">{entry.question}</h3>
            <p className="faq-answer">{entry.answer}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
