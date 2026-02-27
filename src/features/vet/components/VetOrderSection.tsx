import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../../../components/toast/useToast'
import { createVetExamOrder } from '../../../services/vetService'
import type { ExamCatalogItem, Profile, SelectedExam } from '../../../types/app'
import { formatCurrency } from '../../../utils/format'

type VetOrderSectionProps = {
  examCatalog: ExamCatalogItem[]
  profile: Profile
  session: Session
  onOrderCreated: () => Promise<void>
}

export default function VetOrderSection({ examCatalog, profile, session, onOrderCreated }: VetOrderSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [ownerSsn, setOwnerSsn] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [patientName, setPatientName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [ageYears, setAgeYears] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [neuterStatus, setNeuterStatus] = useState<'neutered' | 'not_neutered' | 'unknown' | ''>('')
  const [reactiveStatus, setReactiveStatus] = useState<'reactive' | 'not_reactive' | ''>('')
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({})
  const toast = useToast()

  const selectedExams = useMemo(
    () =>
      examCatalog
        .filter((exam) => selectedQuantities[exam.id] && selectedQuantities[exam.id] > 0)
        .map((exam) => {
          const quantity = selectedQuantities[exam.id]
          const lineTotal = exam.current_price * quantity
          return {
            exam_id: exam.id,
            exam_name: exam.name,
            unit_price: exam.current_price,
            quantity,
            line_total: lineTotal,
          } as SelectedExam
        }),
    [examCatalog, selectedQuantities],
  )

  const totalValue = selectedExams.reduce((sum, item) => sum + item.line_total, 0)

  const handleExamToggle = (examId: number, checked: boolean) => {
    setSelectedQuantities((previous) => {
      const next = { ...previous }
      if (checked) {
        next[examId] = next[examId] ?? 1
      } else {
        delete next[examId]
      }
      return next
    })
  }

  const handleQuantityChange = (examId: number, quantityText: string) => {
    const quantity = Number(quantityText)
    if (!Number.isFinite(quantity) || quantity < 1) {
      return
    }

    setSelectedQuantities((previous) => ({
      ...previous,
      [examId]: Math.floor(quantity),
    }))
  }

  const resetOrderForm = () => {
    setOwnerName('')
    setOwnerSsn('')
    setOwnerPhone('')
    setOwnerAddress('')
    setPatientName('')
    setSpecies('')
    setBreed('')
    setAgeYears('')
    setWeightKg('')
    setNeuterStatus('')
    setReactiveStatus('')
    setSelectedQuantities({})
  }

  const handleSubmitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!neuterStatus || !reactiveStatus) {
      toast.error('Please fill all required animal behavior fields.')
      return
    }

    if (selectedExams.length === 0) {
      toast.error('Select at least one exam before sending the order.')
      return
    }

    setIsSubmitting(true)

    const { error } = await createVetExamOrder({
      vetId: profile.id,
      vetNameSnapshot: profile.full_name,
      vetEmailSnapshot: session.user.email ?? null,
      ownerName: ownerName.trim(),
      ownerSsn: ownerSsn.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerAddress: ownerAddress.trim() || null,
      patientName: patientName.trim(),
      species: species.trim() || null,
      breed: breed.trim() || null,
      ageYears: ageYears ? Number(ageYears) : null,
      weightKg: weightKg ? Number(weightKg) : null,
      neuterStatus,
      reactiveStatus,
      selectedExams,
      totalValue,
    })

    if (error) {
      toast.error(error)
      setIsSubmitting(false)
      return
    }

    toast.success('Exam order sent successfully.')
    resetOrderForm()
    setIsSubmitting(false)
    await onOrderCreated()
  }

  return (
    <form className="form section" onSubmit={handleSubmitOrder}>
      <h2>Order a New Exam</h2>
      <p className="muted small">Fields with <span className="field-required">*</span> are required.</p>

      <div className="grid two">
        <label>
          <span className="field-label">
            Name of Owner <span className="field-required">*</span>
          </span>
          <input required value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
        </label>
        <label>
          <span className="field-label">
            Social Security Number <span className="field-required">*</span>
          </span>
          <input required value={ownerSsn} onChange={(event) => setOwnerSsn(event.target.value)} />
        </label>
      </div>

      <div className="grid two">
        <label>
          <span className="field-label">
            Phone <span className="field-required">*</span>
          </span>
          <input required value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} />
        </label>
        <label>
          <span className="field-label">
            Address <span className="field-optional">(optional)</span>
          </span>
          <input value={ownerAddress} onChange={(event) => setOwnerAddress(event.target.value)} />
        </label>
      </div>

      <div className="grid two">
        <label>
          <span className="field-label">
            Name of Animal <span className="field-required">*</span>
          </span>
          <input required value={patientName} onChange={(event) => setPatientName(event.target.value)} />
        </label>
        <label>
          <span className="field-label">
            Age <span className="field-optional">(optional)</span>
          </span>
          <input min={0} step={1} type="number" value={ageYears} onChange={(event) => setAgeYears(event.target.value)} />
        </label>
      </div>

      <div className="grid three">
        <label>
          <span className="field-label">
            Species <span className="field-optional">(optional)</span>
          </span>
          <input value={species} onChange={(event) => setSpecies(event.target.value)} />
        </label>
        <label>
          <span className="field-label">
            Breed <span className="field-optional">(optional)</span>
          </span>
          <input value={breed} onChange={(event) => setBreed(event.target.value)} />
        </label>
        <label>
          <span className="field-label">
            Weight (kg) <span className="field-optional">(optional)</span>
          </span>
          <input min={0} step="0.01" type="number" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} />
        </label>
      </div>

      <div className="grid two">
        <label>
          <span className="field-label">
            Neutered Status <span className="field-required">*</span>
          </span>
          <select required value={neuterStatus} onChange={(event) => setNeuterStatus(event.target.value as typeof neuterStatus)}>
            <option value="">Select</option>
            <option value="neutered">Neutered</option>
            <option value="not_neutered">Not Neutered</option>
            <option value="unknown">Doesn't know</option>
          </select>
        </label>
        <label>
          <span className="field-label">
            Reactive Status <span className="field-required">*</span>
          </span>
          <select required value={reactiveStatus} onChange={(event) => setReactiveStatus(event.target.value as typeof reactiveStatus)}>
            <option value="">Select</option>
            <option value="reactive">Reactive</option>
            <option value="not_reactive">Not Reactive</option>
          </select>
        </label>
      </div>

      <div className="section">
        <h3>Exam Selection</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>Exam</th>
                <th>Price</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {examCatalog.map((exam) => {
                const isSelected = Boolean(selectedQuantities[exam.id])
                return (
                  <tr key={exam.id}>
                    <td>
                      <input
                        checked={isSelected}
                        type="checkbox"
                        onChange={(event) => handleExamToggle(exam.id, event.target.checked)}
                      />
                    </td>
                    <td>
                      <strong>{exam.name}</strong>
                      <p className="small muted">{exam.description ?? 'No description'}</p>
                    </td>
                    <td>{formatCurrency(exam.current_price)}</td>
                    <td>
                      <input
                        className="qty-input"
                        disabled={!isSelected}
                        min={1}
                        step={1}
                        type="number"
                        value={selectedQuantities[exam.id] ?? 1}
                        onChange={(event) => handleQuantityChange(exam.id, event.target.value)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="total-row">Estimated total: {formatCurrency(totalValue)}</p>
      </div>

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Sending order...' : 'Send Exam Order'}
      </button>
    </form>
  )
}
