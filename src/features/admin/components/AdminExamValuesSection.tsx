import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useToast } from '../../../components/toast/useToast'
import {
  createExam,
  toggleExamActive as toggleExamActiveService,
  updateExamDetails as updateExamDetailsService,
} from '../../../services/adminService'
import type { ExamCatalogItem } from '../../../types/app'
import { formatCurrency } from '../../../utils/format'

type AdminExamValuesSectionProps = {
  examCatalog: ExamCatalogItem[]
  onDataChanged: () => Promise<void>
}

export default function AdminExamValuesSection({
  examCatalog,
  onDataChanged,
}: AdminExamValuesSectionProps) {
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({})
  const [nameDrafts, setNameDrafts] = useState<Record<number, string>>({})
  const [descriptionDrafts, setDescriptionDrafts] = useState<Record<number, string>>({})
  const [categoryDrafts, setCategoryDrafts] = useState<Record<number, string>>({})
  const [activeDrafts, setActiveDrafts] = useState<Record<number, boolean>>({})
  const [newExamName, setNewExamName] = useState('')
  const [newExamCategory, setNewExamCategory] = useState('')
  const [newExamDescription, setNewExamDescription] = useState('')
  const [newExamPrice, setNewExamPrice] = useState('')
  const toast = useToast()
  const activeExamCount = examCatalog.filter((exam) => exam.active).length
  const inactiveExamCount = examCatalog.length - activeExamCount
  const categoryCount = new Set(examCatalog.map((exam) => (exam.category?.trim() ? exam.category.trim() : 'Uncategorized'))).size

  useEffect(() => {
    const nextPriceDrafts: Record<number, string> = {}
    const nextNameDrafts: Record<number, string> = {}
    const nextDescriptionDrafts: Record<number, string> = {}
    const nextCategoryDrafts: Record<number, string> = {}
    const nextActiveDrafts: Record<number, boolean> = {}

    examCatalog.forEach((exam) => {
      nextPriceDrafts[exam.id] = String(exam.current_price)
      nextNameDrafts[exam.id] = exam.name
      nextDescriptionDrafts[exam.id] = exam.description ?? ''
      nextCategoryDrafts[exam.id] = exam.category ?? ''
      nextActiveDrafts[exam.id] = exam.active
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPriceDrafts(nextPriceDrafts)
    setNameDrafts(nextNameDrafts)
    setDescriptionDrafts(nextDescriptionDrafts)
    setCategoryDrafts(nextCategoryDrafts)
    setActiveDrafts(nextActiveDrafts)
  }, [examCatalog])

  const saveExam = async (examId: number) => {
    const nextName = (nameDrafts[examId] ?? '').trim()
    const nextDescription = (descriptionDrafts[examId] ?? '').trim() || null
    const nextCategory = (categoryDrafts[examId] ?? '').trim() || null
    const nextPrice = Number(priceDrafts[examId] ?? '')
    const nextActive = activeDrafts[examId] ?? false

    if (!nextName) {
      toast.error('Exam name cannot be empty.')
      return
    }

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast.error('Price must be a number greater than or equal to zero.')
      return
    }

    const { error } = await updateExamDetailsService({
      examId,
      name: nextName,
      description: nextDescription,
      category: nextCategory,
      currentPrice: nextPrice,
      active: nextActive,
    })

    if (error) {
      if (error.toLowerCase().includes('duplicate key')) {
        toast.error('An exam with this name already exists.')
      } else {
        toast.error(error)
      }
      return
    }

    toast.success('Exam updated.')
    await onDataChanged()
  }

  const toggleExamActive = async (examId: number) => {
    const nextActive = !(activeDrafts[examId] ?? false)

    const { error } = await toggleExamActiveService(examId, nextActive)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(nextActive ? 'Exam enabled.' : 'Exam disabled.')
    await onDataChanged()
  }

  const addExam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedPrice = Number(newExamPrice)
    if (!newExamName.trim()) {
      toast.error('Exam name is required.')
      return
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error('Exam price must be a number greater than or equal to zero.')
      return
    }

    const { error } = await createExam({
      name: newExamName.trim(),
      category: newExamCategory.trim() || null,
      description: newExamDescription.trim() || null,
      currentPrice: parsedPrice,
    })

    if (error) {
      if (error.toLowerCase().includes('duplicate key')) {
        toast.error('An exam with this name already exists.')
      } else {
        toast.error(error)
      }
      return
    }

    setNewExamName('')
    setNewExamCategory('')
    setNewExamDescription('')
    setNewExamPrice('')
    toast.success('New exam added. It is now available in the vet order screen.')
    await onDataChanged()
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <h2>Exam Value Management</h2>
          <p className="muted small">Add new exams, control visibility, and keep pricing consistent for veterinarians.</p>
        </div>
      </div>

      <div className="history-summary-grid exam-management-stats">
        <article className="summary-card exam-management-stat">
          <p className="history-metric-label">Active exams</p>
          <h3 className="history-metric-value">{activeExamCount}</h3>
          <p className="muted small">Visible in the vet ordering flow</p>
        </article>
        <article className="summary-card exam-management-stat">
          <p className="history-metric-label">Inactive exams</p>
          <h3 className="history-metric-value">{inactiveExamCount}</h3>
          <p className="muted small">Hidden until re-enabled</p>
        </article>
        <article className="summary-card exam-management-stat">
          <p className="history-metric-label">Categories</p>
          <h3 className="history-metric-value">{categoryCount}</h3>
          <p className="muted small">Distinct exam groupings in use</p>
        </article>
      </div>

      <section className="exam-management-panel">
        <div className="exam-management-panel-head">
          <div>
            <p className="eyebrow">Create new exam</p>
            <h3>Add an exam to the catalog</h3>
          </div>
          <p className="muted small">Only active exams appear in the veterinarian order screen.</p>
        </div>

        <form className="form inline-form exam-inline-form" onSubmit={addExam}>
          <label>
            Exam name
            <input required value={newExamName} onChange={(event) => setNewExamName(event.target.value)} />
          </label>
          <label>
            Category
            <input placeholder="Blood Exams" value={newExamCategory} onChange={(event) => setNewExamCategory(event.target.value)} />
          </label>
          <label>
            Description
            <input value={newExamDescription} onChange={(event) => setNewExamDescription(event.target.value)} />
          </label>
          <label>
            Price
            <input
              required
              min={0}
              step="0.01"
              type="number"
              value={newExamPrice}
              onChange={(event) => setNewExamPrice(event.target.value)}
            />
          </label>
          <button type="submit">Add Exam</button>
        </form>
      </section>

      <section className="exam-management-panel">
        <div className="exam-management-panel-head">
          <div>
            <p className="eyebrow">Catalog controls</p>
            <h3>Edit prices, names, and availability</h3>
          </div>
          <p className="muted small">{examCatalog.length} exam{examCatalog.length === 1 ? '' : 's'} currently in the catalog.</p>
        </div>

        <div className="exam-editor-list exam-management-table-wrap">
          {examCatalog.map((exam) => (
            <article className="exam-editor-card" key={exam.id}>
              <div className="exam-editor-card-tag">Exam #{exam.id}</div>

              <div className="exam-editor-top">
                <label className="exam-editor-name-field">
                  Exam Name
                  <input
                    className="exam-editor-name-input"
                    value={nameDrafts[exam.id] ?? exam.name}
                    onChange={(event) =>
                      setNameDrafts((previous) => ({
                        ...previous,
                        [exam.id]: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="exam-editor-category-field">
                  Category
                  <input
                    value={categoryDrafts[exam.id] ?? exam.category ?? ''}
                    onChange={(event) =>
                      setCategoryDrafts((previous) => ({
                        ...previous,
                        [exam.id]: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="exam-editor-description-field">
                Description
                <textarea
                  rows={1}
                  value={descriptionDrafts[exam.id] ?? exam.description ?? ''}
                  onChange={(event) =>
                    setDescriptionDrafts((previous) => ({
                      ...previous,
                      [exam.id]: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="exam-editor-footer">
                <div className="exam-editor-meta">
                  <div className="exam-editor-meta-block">
                    <span className="exam-editor-meta-label">Status</span>
                    <span className={activeDrafts[exam.id] ? 'status status-active' : 'status status-inactive'}>
                      {activeDrafts[exam.id] ? 'active' : 'inactive'}
                    </span>
                  </div>

                  <div className="exam-editor-meta-block">
                    <span className="exam-editor-meta-label">Current Price</span>
                    <strong>{formatCurrency(exam.current_price)}</strong>
                  </div>

                  <label className="exam-editor-price-field">
                    <span className="exam-editor-meta-label">New Price</span>
                    <input
                      className="qty-input"
                      min={0}
                      step="0.01"
                      type="number"
                      value={priceDrafts[exam.id] ?? String(exam.current_price)}
                      onChange={(event) =>
                        setPriceDrafts((previous) => ({
                          ...previous,
                          [exam.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="row-actions exam-management-actions">
                  <button className="secondary" type="button" onClick={() => void saveExam(exam.id)}>
                    Save
                  </button>
                  <button className="secondary" type="button" onClick={() => void toggleExamActive(exam.id)}>
                    {activeDrafts[exam.id] ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
