import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../../../components/toast/useToast'
import { createVetExamOrder } from '../../../services/vetService'
import type { ExamCatalogItem, Profile, SelectedExam } from '../../../types/app'
import { formatCurrency, formatPhone, formatSsn, toDigitsOnly } from '../../../utils/format'

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
  const [requestCollection, setRequestCollection] = useState(false)
  const [selectedExamIds, setSelectedExamIds] = useState<Record<number, boolean>>({})
  const toast = useToast()

  const selectedExams = useMemo(
    () =>
      examCatalog
        .filter((exam) => selectedExamIds[exam.id])
        .map((exam) => {
          return {
            exam_id: exam.id,
            exam_name: exam.name,
            unit_price: exam.current_price,
          } as SelectedExam
        }),
    [examCatalog, selectedExamIds],
  )

  const totalValue = selectedExams.reduce((sum, item) => sum + item.unit_price, 0)

  const examsByCategory = useMemo(() => {
    const grouped = new Map<string, ExamCatalogItem[]>()

    examCatalog.forEach((exam) => {
      const categoryName = exam.category?.trim() || 'Other Exams'
      const existing = grouped.get(categoryName)

      if (existing) {
        existing.push(exam)
      } else {
        grouped.set(categoryName, [exam])
      }
    })

    return Array.from(grouped.entries())
  }, [examCatalog])

  const handleExamToggle = (examId: number, checked: boolean) => {
    setSelectedExamIds((previous) => {
      const next = { ...previous }
      if (checked) {
        next[examId] = true
      } else {
        delete next[examId]
      }
      return next
    })
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
    setRequestCollection(false)
    setSelectedExamIds({})
  }

  const handleSubmitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (toDigitsOnly(ownerSsn).length !== 11) {
      toast.error('Owner Social Security Number must have 11 digits.')
      return
    }

    if (toDigitsOnly(ownerPhone).length !== 11) {
      toast.error('Owner Phone must have 11 digits.')
      return
    }

    if (!species.trim()) {
      toast.error('Species is required.')
      return
    }

    if (!ageYears) {
      toast.error('Age is required.')
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
      vetCrmvSnapshot: profile.crmv,
      vetClinicName: profile.clinic_name,
      vetClinicAddress: profile.clinic_address,
      vetProfessionalType: profile.professional_type,
      ownerName: ownerName.trim(),
      ownerSsn: ownerSsn.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerAddress: ownerAddress.trim() || null,
      patientName: patientName.trim(),
      species: species.trim() || null,
      breed: breed.trim() || null,
      ageYears: ageYears ? Number(ageYears) : null,
      weightKg: weightKg ? Number(weightKg) : null,
      neuterStatus: neuterStatus || null,
      reactiveStatus: reactiveStatus || null,
      requestCollection,
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
          <input
            required
            inputMode="numeric"
            maxLength={14}
            placeholder="000.000.000-00"
            value={ownerSsn}
            onChange={(event) => setOwnerSsn(formatSsn(event.target.value))}
          />
        </label>
      </div>

      <div className="grid two">
        <label>
          <span className="field-label">
            Phone <span className="field-required">*</span>
          </span>
          <input
            required
            inputMode="numeric"
            maxLength={15}
            placeholder="(00) 00000-0000"
            value={ownerPhone}
            onChange={(event) => setOwnerPhone(formatPhone(event.target.value))}
          />
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
            Age <span className="field-required">*</span>
          </span>
          <input required min={0} step={1} type="number" value={ageYears} onChange={(event) => setAgeYears(event.target.value)} />
        </label>
      </div>

      <div className="grid three">
        <label>
          <span className="field-label">
            Species <span className="field-required">*</span>
          </span>
          <input required value={species} onChange={(event) => setSpecies(event.target.value)} />
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
            Neutered Status <span className="field-optional">(optional)</span>
          </span>
          <select value={neuterStatus} onChange={(event) => setNeuterStatus(event.target.value as typeof neuterStatus)}>
            <option value="">Select</option>
            <option value="neutered">Neutered</option>
            <option value="not_neutered">Not Neutered</option>
            <option value="unknown">Doesn't know</option>
          </select>
        </label>
        <label>
          <span className="field-label">
            Reactive Status <span className="field-optional">(optional)</span>
          </span>
          <select value={reactiveStatus} onChange={(event) => setReactiveStatus(event.target.value as typeof reactiveStatus)}>
            <option value="">Select</option>
            <option value="reactive">Reactive</option>
            <option value="not_reactive">Not Reactive</option>
          </select>
        </label>
      </div>

      <label className="checkbox-field">
        <input checked={requestCollection} type="checkbox" onChange={(event) => setRequestCollection(event.target.checked)} />
        <span className="field-label">Request collection</span>
      </label>
      <p className="muted small">Select this if CVDE should send the driver to collect the sample at the vet clinic.</p>

      <div className="section">
        <h3>Exam Selection</h3>
        {examsByCategory.map(([categoryName, exams]) => (
          <details className="exam-category-group" key={categoryName} open>
            <summary>{`${categoryName} (${exams.length})`}</summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Exam</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => {
                    const isSelected = Boolean(selectedExamIds[exam.id])
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
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        <p className="total-row">Estimated total: {formatCurrency(totalValue)}</p>
      </div>

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Sending order...' : 'Send Exam Order'}
      </button>
    </form>
  )
}
