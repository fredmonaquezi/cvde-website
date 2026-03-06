import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useToast } from '../../../components/toast/useToast'
import { useI18n } from '../../../i18n'
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
  const { t } = useI18n()
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
  const categoryCount = new Set(
    examCatalog.map((exam) => (exam.category?.trim() ? exam.category.trim() : t('adminExamValues.uncategorized'))),
  ).size

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
      toast.error(t('adminExamValues.validation.nameRequired'))
      return
    }

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast.error(t('adminExamValues.validation.priceInvalid'))
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
        toast.error(t('adminExamValues.validation.duplicateName'))
      } else {
        toast.error(error)
      }
      return
    }

    toast.success(t('adminExamValues.toast.updated'))
    await onDataChanged()
  }

  const toggleExamActive = async (examId: number) => {
    const nextActive = !(activeDrafts[examId] ?? false)

    const { error } = await toggleExamActiveService(examId, nextActive)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(nextActive ? t('adminExamValues.toast.enabled') : t('adminExamValues.toast.disabled'))
    await onDataChanged()
  }

  const addExam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedPrice = Number(newExamPrice)
    if (!newExamName.trim()) {
      toast.error(t('adminExamValues.validation.nameRequired'))
      return
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error(t('adminExamValues.validation.priceInvalid'))
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
        toast.error(t('adminExamValues.validation.duplicateName'))
      } else {
        toast.error(error)
      }
      return
    }

    setNewExamName('')
    setNewExamCategory('')
    setNewExamDescription('')
    setNewExamPrice('')
    toast.success(t('adminExamValues.toast.created'))
    await onDataChanged()
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <h2>{t('adminExamValues.title')}</h2>
          <p className="muted small">{t('adminExamValues.subtitle')}</p>
        </div>
      </div>

      <div className="history-summary-grid exam-management-stats">
        <article className="summary-card exam-management-stat">
          <p className="history-metric-label">{t('adminExamValues.stats.active.label')}</p>
          <h3 className="history-metric-value">{activeExamCount}</h3>
          <p className="muted small">{t('adminExamValues.stats.active.copy')}</p>
        </article>
        <article className="summary-card exam-management-stat">
          <p className="history-metric-label">{t('adminExamValues.stats.inactive.label')}</p>
          <h3 className="history-metric-value">{inactiveExamCount}</h3>
          <p className="muted small">{t('adminExamValues.stats.inactive.copy')}</p>
        </article>
        <article className="summary-card exam-management-stat">
          <p className="history-metric-label">{t('adminExamValues.stats.categories.label')}</p>
          <h3 className="history-metric-value">{categoryCount}</h3>
          <p className="muted small">{t('adminExamValues.stats.categories.copy')}</p>
        </article>
      </div>

      <section className="exam-management-panel">
        <div className="exam-management-panel-head">
          <div>
            <p className="eyebrow">{t('adminExamValues.create.eyebrow')}</p>
            <h3>{t('adminExamValues.create.title')}</h3>
          </div>
          <p className="muted small">{t('adminExamValues.create.copy')}</p>
        </div>

        <form className="form inline-form exam-inline-form" onSubmit={addExam}>
          <label>
            {t('adminExamValues.form.examName')}
            <input required value={newExamName} onChange={(event) => setNewExamName(event.target.value)} />
          </label>
          <label>
            {t('adminExamValues.form.category')}
            <input
              placeholder={t('adminExamValues.form.categoryPlaceholder')}
              value={newExamCategory}
              onChange={(event) => setNewExamCategory(event.target.value)}
            />
          </label>
          <label>
            {t('adminExamValues.form.description')}
            <input value={newExamDescription} onChange={(event) => setNewExamDescription(event.target.value)} />
          </label>
          <label>
            {t('adminExamValues.form.price')}
            <input
              required
              min={0}
              step="0.01"
              type="number"
              value={newExamPrice}
              onChange={(event) => setNewExamPrice(event.target.value)}
            />
          </label>
          <button type="submit">{t('adminExamValues.form.submit')}</button>
        </form>
      </section>

      <section className="exam-management-panel">
        <div className="exam-management-panel-head">
          <div>
            <p className="eyebrow">{t('adminExamValues.catalog.eyebrow')}</p>
            <h3>{t('adminExamValues.catalog.title')}</h3>
          </div>
          <p className="muted small">{t('adminExamValues.catalog.count', { count: examCatalog.length })}</p>
        </div>

        <div className="exam-editor-list exam-management-table-wrap">
          {examCatalog.map((exam) => (
            <article className="exam-editor-card" key={exam.id}>
              <div className="exam-editor-card-tag">{t('adminExamValues.catalog.examId', { id: exam.id })}</div>

              <div className="exam-editor-top">
                <label className="exam-editor-name-field">
                  {t('adminExamValues.form.examName')}
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
                  {t('adminExamValues.form.category')}
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
                {t('adminExamValues.form.description')}
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
                    <span className="exam-editor-meta-label">{t('adminExamValues.meta.status')}</span>
                    <span className={activeDrafts[exam.id] ? 'status status-active' : 'status status-inactive'}>
                      {activeDrafts[exam.id] ? t('common.statusActive') : t('common.statusInactive')}
                    </span>
                  </div>

                  <div className="exam-editor-meta-block">
                    <span className="exam-editor-meta-label">{t('adminExamValues.meta.currentPrice')}</span>
                    <strong>{formatCurrency(exam.current_price)}</strong>
                  </div>

                  <label className="exam-editor-price-field">
                    <span className="exam-editor-meta-label">{t('adminExamValues.meta.newPrice')}</span>
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
                    {t('common.save')}
                  </button>
                  <button className="secondary" type="button" onClick={() => void toggleExamActive(exam.id)}>
                    {activeDrafts[exam.id] ? t('common.disable') : t('common.enable')}
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
