import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../../../components/toast/useToast'
import { completeVetRegistration } from '../../../services/authService'
import type { Profile, VetProfessionalType } from '../../../types/app'
import { formatPhone, formatSsn, toDigitsOnly } from '../../../utils/format'

type VetRegistrationGateProps = {
  profile: Profile
  session: Session
  onProfileUpdated: (nextProfile: Profile) => void
}

export default function VetRegistrationGate({ profile, session, onProfileUpdated }: VetRegistrationGateProps) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [crmv, setCrmv] = useState(profile.crmv ?? '')
  const [ssn, setSsn] = useState(formatSsn(profile.ssn ?? ''))
  const [phone, setPhone] = useState(formatPhone(profile.phone ?? ''))
  const [professionalType, setProfessionalType] = useState<VetProfessionalType | ''>(profile.professional_type ?? '')
  const [clinicName, setClinicName] = useState(profile.clinic_name ?? '')
  const [clinicAddress, setClinicAddress] = useState(profile.clinic_address ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!fullName.trim() || !crmv.trim() || !ssn.trim() || !phone.trim() || !professionalType) {
      toast.error('Please fill all required registration fields.')
      return
    }

    if (toDigitsOnly(ssn).length !== 11) {
      toast.error('Social Security Number must have 11 digits.')
      return
    }

    if (toDigitsOnly(phone).length !== 11) {
      toast.error('Phone Number must have 11 digits.')
      return
    }

    if (professionalType === 'clinic' && (!clinicName.trim() || !clinicAddress.trim())) {
      toast.error('Please provide the clinic name and clinic address.')
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
      clinicAddress: professionalType === 'clinic' ? clinicAddress.trim() : null,
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
              <input
                required
                inputMode="numeric"
                maxLength={14}
                placeholder="000.000.000-00"
                value={ssn}
                onChange={(event) => setSsn(formatSsn(event.target.value))}
              />
            </label>
            <label>
              <span className="field-label">
                Phone Number <span className="field-required">*</span>
              </span>
              <input
                required
                inputMode="numeric"
                maxLength={15}
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(event) => setPhone(formatPhone(event.target.value))}
              />
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
              onChange={(event) => {
                const nextProfessionalType = event.target.value as VetProfessionalType | ''
                setProfessionalType(nextProfessionalType)
                if (nextProfessionalType !== 'clinic') {
                  setClinicName('')
                  setClinicAddress('')
                }
              }}
            >
              <option value="">Select</option>
              <option value="clinic">Works at a clinic</option>
              <option value="independent">Independent professional</option>
            </select>
          </label>
        </div>

        {professionalType === 'clinic' ? (
          <div className="grid two">
            <label>
              <span className="field-label">
                Clinic Name <span className="field-required">*</span>
              </span>
              <input required value={clinicName} onChange={(event) => setClinicName(event.target.value)} />
            </label>
            <label>
              <span className="field-label">
                Clinic Address <span className="field-required">*</span>
              </span>
              <input required value={clinicAddress} onChange={(event) => setClinicAddress(event.target.value)} />
            </label>
          </div>
        ) : null}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving registration...' : 'Complete Registration'}
        </button>
      </form>
    </section>
  )
}
