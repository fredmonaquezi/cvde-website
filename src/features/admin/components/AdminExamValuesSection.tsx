import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useToast } from '../../../components/toast/useToast'
import {
  createExam,
  toggleExamActive as toggleExamActiveService,
  updateExamDetails as updateExamDetailsService,
  updateExamPrice as updateExamPriceService,
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
  const [activeDrafts, setActiveDrafts] = useState<Record<number, boolean>>({})
  const [newExamName, setNewExamName] = useState('')
  const [newExamDescription, setNewExamDescription] = useState('')
  const [newExamPrice, setNewExamPrice] = useState('')
  const toast = useToast()

  useEffect(() => {
    const nextPriceDrafts: Record<number, string> = {}
    const nextNameDrafts: Record<number, string> = {}
    const nextDescriptionDrafts: Record<number, string> = {}
    const nextActiveDrafts: Record<number, boolean> = {}

    examCatalog.forEach((exam) => {
      nextPriceDrafts[exam.id] = String(exam.current_price)
      nextNameDrafts[exam.id] = exam.name
      nextDescriptionDrafts[exam.id] = exam.description ?? ''
      nextActiveDrafts[exam.id] = exam.active
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPriceDrafts(nextPriceDrafts)
    setNameDrafts(nextNameDrafts)
    setDescriptionDrafts(nextDescriptionDrafts)
    setActiveDrafts(nextActiveDrafts)
  }, [examCatalog])

  const saveExamPrice = async (examId: number) => {
    const draft = priceDrafts[examId]
    const parsed = Number(draft)

    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Price must be a number greater than or equal to zero.')
      return
    }

    const { error } = await updateExamPriceService({
      examId,
      currentPrice: parsed,
    })

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Price updated.')
    await onDataChanged()
  }

  const saveExamDetails = async (examId: number) => {
    const nextName = (nameDrafts[examId] ?? '').trim()
    const nextDescription = (descriptionDrafts[examId] ?? '').trim() || null
    const nextActive = activeDrafts[examId] ?? false

    if (!nextName) {
      toast.error('Exam name cannot be empty.')
      return
    }

    const { error } = await updateExamDetailsService({
      examId,
      name: nextName,
      description: nextDescription,
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

    toast.success('Exam details updated.')
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
    setNewExamDescription('')
    setNewExamPrice('')
    toast.success('New exam added. It is now available in the vet order screen.')
    await onDataChanged()
  }

  return (
    <section className="section">
      <h2>Exam Value Management</h2>
      <p className="muted small">Add new exams and edit existing ones here. Only active exams appear in "Order a Vet Exam".</p>

      <form className="form inline-form section" onSubmit={addExam}>
        <label>
          Exam name
          <input required value={newExamName} onChange={(event) => setNewExamName(event.target.value)} />
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

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Current Price</th>
              <th>New Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {examCatalog.map((exam) => (
              <tr key={exam.id}>
                <td>
                  <input
                    value={nameDrafts[exam.id] ?? exam.name}
                    onChange={(event) =>
                      setNameDrafts((previous) => ({
                        ...previous,
                        [exam.id]: event.target.value,
                      }))
                    }
                  />
                </td>
                <td>
                  <input
                    value={descriptionDrafts[exam.id] ?? exam.description ?? ''}
                    onChange={(event) =>
                      setDescriptionDrafts((previous) => ({
                        ...previous,
                        [exam.id]: event.target.value,
                      }))
                    }
                  />
                </td>
                <td>
                  <span className={activeDrafts[exam.id] ? 'status status-active' : 'status status-inactive'}>
                    {activeDrafts[exam.id] ? 'active' : 'inactive'}
                  </span>
                </td>
                <td>{formatCurrency(exam.current_price)}</td>
                <td>
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
                </td>
                <td>
                  <div className="row-actions">
                    <button className="secondary" type="button" onClick={() => void saveExamDetails(exam.id)}>
                      Save Details
                    </button>
                    <button className="secondary" type="button" onClick={() => void toggleExamActive(exam.id)}>
                      {activeDrafts[exam.id] ? 'Disable' : 'Enable'}
                    </button>
                    <button className="secondary" type="button" onClick={() => void saveExamPrice(exam.id)}>
                      Save Price
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
