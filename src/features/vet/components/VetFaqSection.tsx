import type { FaqEntry } from '../../../types/app'

type VetFaqSectionProps = {
  faqEntries: FaqEntry[]
}

export default function VetFaqSection({ faqEntries }: VetFaqSectionProps) {
  return (
    <section className="section">
      <h2>Technical Questions</h2>
      <div className="faq-list">
        {faqEntries.length === 0 ? <p>No FAQ entries yet.</p> : null}
        {faqEntries.map((entry) => (
          <article className="faq-item" key={entry.id}>
            <h3>{entry.question}</h3>
            <p className="small muted">{entry.category ?? 'General'}</p>
            <p>{entry.answer}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
