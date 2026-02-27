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
  const toast = useToast()

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
      <h2>FAQ Management</h2>

      <form className="form faq-form" onSubmit={addFaqEntry}>
        <label>
          Question
          <input required value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} />
        </label>
        <label>
          Answer
          <textarea required rows={3} value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} />
        </label>
        <label>
          Category
          <input value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)} />
        </label>
        <button type="submit">Add FAQ</button>
      </form>

      <div className="faq-list">
        {faqEntries.map((entry) => (
          <article className="faq-item" key={entry.id}>
            <div className="faq-head">
              <h3>{entry.question}</h3>
              <button className="secondary" type="button" onClick={() => void toggleFaqActive(entry)}>
                {entry.active ? 'Disable' : 'Enable'}
              </button>
            </div>
            <p className="small muted">{entry.category ?? 'General'}</p>
            <p>{entry.answer}</p>
            <p className="small muted">Status: {entry.active ? 'active' : 'inactive'}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
