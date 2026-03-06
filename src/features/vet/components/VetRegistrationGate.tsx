import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../../../components/toast/useToast'
import { useI18n } from '../../../i18n'
import { completeVetRegistration } from '../../../services/authService'
import type { Profile, VetProfessionalType } from '../../../types/app'
import {
  BRAZIL_STATE_OPTIONS,
  buildClinicAddress,
  createEmptyClinicAddressFields,
  isClinicAddressComplete,
  parseClinicAddress,
  type ClinicAddressFields,
} from '../../../utils/clinicAddress'
import { formatPhone, formatSsn, toDigitsOnly } from '../../../utils/format'

type VetRegistrationGateProps = {
  profile: Profile
  session: Session
  onProfileUpdated: (nextProfile: Profile) => void
}

export default function VetRegistrationGate({ profile, session, onProfileUpdated }: VetRegistrationGateProps) {
  const { t } = useI18n()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [crmv, setCrmv] = useState(profile.crmv ?? '')
  const [ssn, setSsn] = useState(formatSsn(profile.ssn ?? ''))
  const [phone, setPhone] = useState(formatPhone(profile.phone ?? ''))
  const [professionalType, setProfessionalType] = useState<VetProfessionalType | ''>(profile.professional_type ?? '')
  const [clinicName, setClinicName] = useState(profile.clinic_name ?? '')
  const [clinicAddress, setClinicAddress] = useState<ClinicAddressFields>(() => parseClinicAddress(profile.clinic_address))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!fullName.trim() || !crmv.trim() || !ssn.trim() || !phone.trim() || !professionalType) {
      toast.error(t('vetRegistration.validation.requiredFields'))
      return
    }

    if (toDigitsOnly(ssn).length !== 11) {
      toast.error(t('vetRegistration.validation.cpfLength'))
      return
    }

    if (toDigitsOnly(phone).length !== 11) {
      toast.error(t('vetRegistration.validation.phoneLength'))
      return
    }

    if (professionalType === 'clinic' && (!clinicName.trim() || !isClinicAddressComplete(clinicAddress))) {
      toast.error(t('vetRegistration.validation.clinicAddressRequired'))
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
      clinicAddress: professionalType === 'clinic' ? buildClinicAddress(clinicAddress) : null,
    })
    setIsSubmitting(false)

    if (error || !data) {
      toast.error(error ?? t('vetRegistration.validation.submitError'))
      return
    }

    onProfileUpdated(data)
    toast.success(t('vetRegistration.toast.success'))
  }

  const updateClinicAddressField = (field: keyof ClinicAddressFields, value: string) => {
    setClinicAddress((current) => ({
      ...current,
      [field]: value,
    }))
  }

  return (
    <section className="section registration-gate">
      <h2>{t('vetRegistration.title')}</h2>
      <p className="muted small">{t('vetRegistration.subtitle')}</p>
      <p className="muted small">
        {t('common.requiredFieldsPrefix')} <span className="field-required">*</span> {t('common.requiredFieldsSuffix')}
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="grid two">
          <label>
            <span className="field-label">
              {t('common.fields.fullName')} <span className="field-required">*</span>
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
              <span className="field-label">{t('common.fields.cpf')} <span className="field-required">*</span></span>
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
              <span className="field-label">{t('common.fields.phone')} <span className="field-required">*</span></span>
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
              {t('common.fields.email')} <span className="field-required">*</span>
            </span>
            <input readOnly value={session.user.email ?? ''} />
          </label>
          <label>
            <span className="field-label">
              {t('common.fields.workMode')} <span className="field-required">*</span>
            </span>
            <select
              required
              value={professionalType}
              onChange={(event) => {
                const nextProfessionalType = event.target.value as VetProfessionalType | ''
                setProfessionalType(nextProfessionalType)
                if (nextProfessionalType !== 'clinic') {
                  setClinicName('')
                  setClinicAddress(createEmptyClinicAddressFields())
                }
              }}
            >
              <option value="">{t('common.select')}</option>
              <option value="clinic">{t('common.workMode.clinic')}</option>
              <option value="independent">{t('common.workMode.independent')}</option>
            </select>
          </label>
        </div>

        {professionalType === 'clinic' ? (
          <>
            <label>
              <span className="field-label">
                {t('common.fields.clinicName')} <span className="field-required">*</span>
              </span>
              <input required value={clinicName} onChange={(event) => setClinicName(event.target.value)} />
            </label>

            <section className="form-subsection">
              <div className="form-subsection-header">
                <div>
                  <h3>{t('common.fields.clinicAddress')}</h3>
                  <p className="muted small">{t('vetRegistration.clinicAddressHelp')}</p>
                </div>
              </div>

              <div className="grid address-grid-line-one">
                <label>
                  <span className="field-label">
                    {t('common.fields.street')} <span className="field-required">*</span>
                  </span>
                  <input
                    required
                    value={clinicAddress.street}
                    onChange={(event) => updateClinicAddressField('street', event.target.value)}
                  />
                </label>
                <label>
                  <span className="field-label">
                    {t('common.fields.number')} <span className="field-required">*</span>
                  </span>
                  <input
                    required
                    value={clinicAddress.number}
                    onChange={(event) => updateClinicAddressField('number', event.target.value)}
                  />
                </label>
              </div>

              <div className="grid address-grid-line-two">
                <label>
                  <span className="field-label">
                    {t('common.fields.neighborhood')} <span className="field-required">*</span>
                  </span>
                  <input
                    required
                    value={clinicAddress.neighborhood}
                    onChange={(event) => updateClinicAddressField('neighborhood', event.target.value)}
                  />
                </label>
                <label>
                  <span className="field-label">
                    {t('common.fields.city')} <span className="field-required">*</span>
                  </span>
                  <input
                    required
                    value={clinicAddress.city}
                    onChange={(event) => updateClinicAddressField('city', event.target.value)}
                  />
                </label>
                <label>
                  <span className="field-label">
                    {t('common.fields.state')} <span className="field-required">*</span>
                  </span>
                  <select
                    required
                    value={clinicAddress.state}
                    onChange={(event) => updateClinicAddressField('state', event.target.value)}
                  >
                    <option value="">{t('common.selectState')}</option>
                    {BRAZIL_STATE_OPTIONS.map((stateOption) => (
                      <option key={stateOption.value} value={stateOption.value}>
                        {stateOption.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          </>
        ) : null}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? t('vetRegistration.submit.loading') : t('vetRegistration.submit.default')}
        </button>
      </form>
    </section>
  )
}
