import { useState } from 'react'
import type { FormEvent } from 'react'
import { useToast } from '../../../components/toast/useToast'
import { useI18n } from '../../../i18n'
import { createFaqEntry, toggleFaqEntryActive } from '../../../services/adminService'
import type { FaqEntry } from '../../../types/app'

type AdminFaqSectionProps = {
  faqEntries: FaqEntry[]
  onDataChanged: () => Promise<void>
}

export default function AdminFaqSection({ faqEntries, onDataChanged }: AdminFaqSectionProps) {
  const { t } = useI18n()
  const [faqQuestion, setFaqQuestion] = useState('')
  const [faqAnswer, setFaqAnswer] = useState('')
  const [faqCategory, setFaqCategory] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const toast = useToast()
  const activeFaqCount = faqEntries.filter((entry) => entry.active).length
  const inactiveFaqCount = faqEntries.length - activeFaqCount

  const addFaqEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const { error } = await createFaqEntry({
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
      category: faqCategory.trim() || null,
    })

    if (error) {
      toast.error(error)
      return
    }

    setFaqQuestion('')
    setFaqAnswer('')
    setFaqCategory('')
    toast.success(t('adminFaq.toast.created'))
    await onDataChanged()
  }

  const toggleFaqActive = async (entry: FaqEntry) => {
    const { error } = await toggleFaqEntryActive(entry.id, !entry.active)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(entry.active ? t('adminFaq.toast.disabled') : t('adminFaq.toast.enabled'))
    await onDataChanged()
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <h2>{t('adminFaq.title')}</h2>
          <p className="muted small">{t('adminFaq.subtitle')}</p>
        </div>
      </div>

      <div className="history-summary-grid faq-management-stats">
        <article className="summary-card faq-management-stat">
          <p className="history-metric-label">{t('adminFaq.stats.active.label')}</p>
          <h3 className="history-metric-value">{activeFaqCount}</h3>
          <p className="muted small">{t('adminFaq.stats.active.copy')}</p>
        </article>
        <article className="summary-card faq-management-stat">
          <p className="history-metric-label">{t('adminFaq.stats.inactive.label')}</p>
          <h3 className="history-metric-value">{inactiveFaqCount}</h3>
          <p className="muted small">{t('adminFaq.stats.inactive.copy')}</p>
        </article>
        <article className="summary-card faq-management-stat">
          <p className="history-metric-label">{t('adminFaq.stats.total.label')}</p>
          <h3 className="history-metric-value">{faqEntries.length}</h3>
          <p className="muted small">{t('adminFaq.stats.total.copy')}</p>
        </article>
      </div>

      <section className="faq-management-panel">
        <button
          aria-expanded={isCreateOpen}
          className={isCreateOpen ? 'secondary faq-create-toggle active' : 'secondary faq-create-toggle'}
          type="button"
          onClick={() => setIsCreateOpen((current) => !current)}
        >
          <span className="faq-create-toggle-copy">
            <span className="faq-create-toggle-eyebrow">{t('adminFaq.create.eyebrow')}</span>
            <span className="faq-create-toggle-title">{t('adminFaq.create.title')}</span>
            <span className="faq-create-toggle-subtitle">{t('adminFaq.create.copy')}</span>
          </span>
          <span aria-hidden="true" className="faq-create-toggle-caret">
            {isCreateOpen ? '˄' : '˅'}
          </span>
        </button>

        {isCreateOpen ? (
          <form className="form faq-form admin-faq-form" onSubmit={addFaqEntry}>
            <label>
              {t('adminFaq.form.question')}
              <input required value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} />
            </label>
            <label>
              {t('adminFaq.form.answer')}
              <textarea required rows={4} value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} />
            </label>
            <label>
              {t('adminFaq.form.category')}
              <input value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)} />
            </label>
            <button type="submit">{t('adminFaq.form.submit')}</button>
          </form>
        ) : null}
      </section>

      <section className="faq-management-panel">
        <div className="faq-management-panel-head">
          <div>
            <p className="eyebrow">{t('adminFaq.catalog.eyebrow')}</p>
            <h3>{t('adminFaq.catalog.title')}</h3>
          </div>
          <p className="muted small">{t('adminFaq.catalog.count', { count: faqEntries.length })}</p>
        </div>

        <div className="faq-list faq-list-spacious admin-faq-list">
          {faqEntries.map((entry) => (
            <article className="faq-item faq-item-rich admin-faq-item" key={entry.id}>
              <div className="faq-head admin-faq-head">
                <div className="admin-faq-title-block">
                  <span className="faq-category-pill">{entry.category ?? t('adminFaq.generalCategory')}</span>
                  <h3 className="faq-question">{entry.question}</h3>
                </div>
                <div className="admin-faq-status-actions">
                  <span className={entry.active ? 'status status-active' : 'status status-inactive'}>
                    {entry.active ? t('common.statusActive') : t('common.statusInactive')}
                  </span>
                  <button className="secondary" type="button" onClick={() => void toggleFaqActive(entry)}>
                    {entry.active ? t('common.disable') : t('common.enable')}
                  </button>
                </div>
              </div>
              <p className="faq-answer">{entry.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
