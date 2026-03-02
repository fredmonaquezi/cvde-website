import { useState } from 'react'
import type { FormEvent } from 'react'
import { useToast } from '../../../components/toast/useToast'
import { createFaqEntry, toggleFaqEntryActive } from '../../../services/adminService'
import type { FaqEntry } from '../../../types/app'

type AdminFaqSectionProps = {
  faqEntries: FaqEntry[]
  onDataChanged: () => Promise<void>
}

export default function AdminFaqSection({ faqEntries, onDataChanged }: AdminFaqSectionProps) {
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
    toast.success('FAQ entry created.')
    await onDataChanged()
  }

  const toggleFaqActive = async (entry: FaqEntry) => {
    const { error } = await toggleFaqEntryActive(entry.id, !entry.active)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(entry.active ? 'FAQ disabled.' : 'FAQ enabled.')
    await onDataChanged()
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <h2>FAQ Management</h2>
          <p className="muted small">Create support answers and keep the veterinarian knowledge base current and easy to maintain.</p>
        </div>
      </div>

      <div className="history-summary-grid faq-management-stats">
        <article className="summary-card faq-management-stat">
          <p className="history-metric-label">Active entries</p>
          <h3 className="history-metric-value">{activeFaqCount}</h3>
          <p className="muted small">Visible to veterinarians right now</p>
        </article>
        <article className="summary-card faq-management-stat">
          <p className="history-metric-label">Inactive entries</p>
          <h3 className="history-metric-value">{inactiveFaqCount}</h3>
          <p className="muted small">Saved but hidden from the FAQ view</p>
        </article>
        <article className="summary-card faq-management-stat">
          <p className="history-metric-label">Total entries</p>
          <h3 className="history-metric-value">{faqEntries.length}</h3>
          <p className="muted small">Current FAQ catalog size</p>
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
            <span className="faq-create-toggle-eyebrow">Create FAQ</span>
            <span className="faq-create-toggle-title">Add a new support answer</span>
            <span className="faq-create-toggle-subtitle">
              Use short categories so answers stay easy to scan in the vet portal.
            </span>
          </span>
          <span aria-hidden="true" className="faq-create-toggle-caret">
            {isCreateOpen ? '˄' : '˅'}
          </span>
        </button>

        {isCreateOpen ? (
          <form className="form faq-form admin-faq-form" onSubmit={addFaqEntry}>
            <label>
              Question
              <input required value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} />
            </label>
            <label>
              Answer
              <textarea required rows={4} value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} />
            </label>
            <label>
              Category
              <input value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)} />
            </label>
            <button type="submit">Add FAQ</button>
          </form>
        ) : null}
      </section>

      <section className="faq-management-panel">
        <div className="faq-management-panel-head">
          <div>
            <p className="eyebrow">Knowledge base</p>
            <h3>Existing FAQ entries</h3>
          </div>
          <p className="muted small">{faqEntries.length} entr{faqEntries.length === 1 ? 'y' : 'ies'} ready for review.</p>
        </div>

        <div className="faq-list faq-list-spacious admin-faq-list">
          {faqEntries.map((entry) => (
            <article className="faq-item faq-item-rich admin-faq-item" key={entry.id}>
              <div className="faq-head admin-faq-head">
                <div className="admin-faq-title-block">
                  <span className="faq-category-pill">{entry.category ?? 'General'}</span>
                  <h3 className="faq-question">{entry.question}</h3>
                </div>
                <div className="admin-faq-status-actions">
                  <span className={entry.active ? 'status status-active' : 'status status-inactive'}>
                    {entry.active ? 'active' : 'inactive'}
                  </span>
                  <button className="secondary" type="button" onClick={() => void toggleFaqActive(entry)}>
                    {entry.active ? 'Disable' : 'Enable'}
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
