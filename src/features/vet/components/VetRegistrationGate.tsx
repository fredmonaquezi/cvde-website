import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../../../components/toast/useToast'
import { completeVetRegistration } from '../../../services/authService'
import type { Profile, VetProfessionalType } from '../../../types/app'

type VetRegistrationGateProps = {
  profile: Profile
  session: Session
  onProfileUpdated: (nextProfile: Profile) => void
}

export default function VetRegistrationGate({ profile, session, onProfileUpdated }: VetRegistrationGateProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [crmv, setCrmv] = useState(profile.crmv ?? '')
  const [ssn, setSsn] = useState(profile.ssn ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [professionalType, setProfessionalType] = useState<VetProfessionalType | ''>(profile.professional_type ?? '')
  const [clinicName, setClinicName] = useState(profile.clinic_name ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!fullName.trim() || !crmv.trim() || !ssn.trim() || !phone.trim() || !professionalType) {
      toast.error('Please fill all required registration fields.')
      return
    }

    if (professionalType === 'clinic' && !clinicName.trim()) {
      toast.error('Please provide the clinic name.')
      return
    }

    setIsSubmitting(true)
    const { data, error } = await completeVetRegistration(profile.id, {
      fullName: fullName.trim(),
      crmv: crmv.trim(),
      ssn: ssn.trim(),
      phone: phone.trim(),
      professionalType,
      clinicName: professionalType === 'clinic' ? clinicName.trim() : null,
    })
    setIsSubmitting(false)

    if (error || !data) {
      toast.error(error ?? 'Failed to complete registration.')
      return
    }

    onProfileUpdated(data)
    toast.success('Registration completed successfully.')
  }

  return (
    <section className="section registration-gate">
      <h2>Complete Your Registration</h2>
      <p className="muted small">Before using the platform, please complete your professional profile.</p>
      <p className="muted small">Fields with <span className="field-required">*</span> are required.</p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="grid two">
          <label>
            <span className="field-label">
              Full Name <span className="field-required">*</span>
            </span>
            <input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label>
            <span className="field-label">
              CRMV <span className="field-required">*</span>
            </span>
            <input required value={crmv} onChange={(event) => setCrmv(event.target.value)} />
          </label>
        </div>

        <div className="grid two">
          <label>
            <span className="field-label">
              Social Security Number <span className="field-required">*</span>
            </span>
            <input required value={ssn} onChange={(event) => setSsn(event.target.value)} />
          </label>
          <label>
            <span className="field-label">
              Phone Number <span className="field-required">*</span>
            </span>
            <input required value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
        </div>

        <div className="grid two">
          <label>
            <span className="field-label">
              Email <span className="field-required">*</span>
            </span>
            <input readOnly value={session.user.email ?? ''} />
          </label>
          <label>
            <span className="field-label">
              Work Mode <span className="field-required">*</span>
            </span>
            <select
              required
              value={professionalType}
              onChange={(event) => setProfessionalType(event.target.value as VetProfessionalType | '')}
            >
              <option value="">Select</option>
              <option value="clinic">Works at a clinic</option>
              <option value="independent">Independent professional</option>
            </select>
          </label>
        </div>

        {professionalType === 'clinic' ? (
          <label>
            <span className="field-label">
              Clinic Name <span className="field-required">*</span>
            </span>
            <input required value={clinicName} onChange={(event) => setClinicName(event.target.value)} />
          </label>
        ) : null}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving registration...' : 'Complete Registration'}
        </button>
      </form>
    </section>
  )
}
