import type { FaqEntry } from '../../../types/app'
import { useI18n } from '../../../i18n'

type VetFaqSectionProps = {
  faqEntries: FaqEntry[]
}

export default function VetFaqSection({ faqEntries }: VetFaqSectionProps) {
  const { t } = useI18n()

  return (
    <section className="section">
      <div className="faq-section-intro">
        <h2>{t('vetFaq.title')}</h2>
        <p className="muted">{t('vetFaq.subtitle')}</p>
      </div>

      <div className="faq-list faq-list-spacious">
        {faqEntries.length === 0 ? <p className="faq-empty-state">{t('vetFaq.empty')}</p> : null}
        {faqEntries.map((entry) => (
          <article className="faq-item faq-item-rich" key={entry.id}>
            <div className="faq-item-top">
              <span className="faq-category-pill">{entry.category ?? t('vetFaq.generalCategory')}</span>
            </div>
            <h3 className="faq-question">{entry.question}</h3>
            <p className="faq-answer">{entry.answer}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
