import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../../../components/toast/useToast'
import { useI18n } from '../../../i18n'
import { updateUserEmail, updateUserPassword, updateVetProfileDetails } from '../../../services/authService'
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

type VetProfileSectionProps = {
  profile: Profile
  session: Session
  onProfileUpdated: (nextProfile: Profile) => void
}

type ProfileFormState = {
  fullName: string
  crmv: string
  ssn: string
  phone: string
  email: string
  professionalType: VetProfessionalType | ''
  clinicName: string
  clinicAddress: ClinicAddressFields
}

function createProfileFormState(profile: Profile, email: string): ProfileFormState {
  return {
    fullName: profile.full_name ?? '',
    crmv: profile.crmv ?? '',
    ssn: formatSsn(profile.ssn ?? ''),
    phone: formatPhone(profile.phone ?? ''),
    email,
    professionalType: profile.professional_type ?? '',
    clinicName: profile.clinic_name ?? '',
    clinicAddress: parseClinicAddress(profile.clinic_address),
  }
}

export default function VetProfileSection({ profile, session, onProfileUpdated }: VetProfileSectionProps) {
  const { t } = useI18n()
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [profileForm, setProfileForm] = useState(() => createProfileFormState(profile, session.user.email ?? ''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const toast = useToast()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileForm(createProfileFormState(profile, session.user.email ?? ''))
  }, [profile, session.user.email])

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedFullName = profileForm.fullName.trim()
    const trimmedCrmv = profileForm.crmv.trim()
    const trimmedSsn = profileForm.ssn.trim()
    const trimmedPhone = profileForm.phone.trim()
    const trimmedEmail = profileForm.email.trim()
    const trimmedClinicName = profileForm.clinicName.trim()
    const nextClinicAddress = buildClinicAddress(profileForm.clinicAddress)

    if (
      !trimmedFullName ||
      !trimmedCrmv ||
      !trimmedSsn ||
      !trimmedPhone ||
      !trimmedEmail ||
      !profileForm.professionalType
    ) {
      toast.error(t('vetProfile.validation.requiredFields'))
      return
    }

    if (toDigitsOnly(trimmedSsn).length !== 11) {
      toast.error(t('vetProfile.validation.cpfLength'))
      return
    }

    if (toDigitsOnly(trimmedPhone).length !== 11) {
      toast.error(t('vetProfile.validation.phoneLength'))
      return
    }

    if (profileForm.professionalType === 'clinic' && (!trimmedClinicName || !isClinicAddressComplete(profileForm.clinicAddress))) {
      toast.error(t('vetProfile.validation.clinicAddressRequired'))
      return
    }

    setIsSavingProfile(true)
    const { data, error } = await updateVetProfileDetails(profile.id, {
      fullName: trimmedFullName,
      crmv: trimmedCrmv,
      ssn: trimmedSsn,
      phone: trimmedPhone,
      professionalType: profileForm.professionalType,
      clinicName: profileForm.professionalType === 'clinic' ? trimmedClinicName : null,
      clinicAddress: profileForm.professionalType === 'clinic' ? nextClinicAddress : null,
    })

    if (error || !data) {
      setIsSavingProfile(false)
      toast.error(error ?? t('vetProfile.validation.submitError'))
      return
    }

    const currentEmail = session.user.email?.trim() ?? ''
    const isEmailChanged = trimmedEmail !== currentEmail

    if (isEmailChanged) {
      const emailUpdate = await updateUserEmail(trimmedEmail)
      setIsSavingProfile(false)
      onProfileUpdated(data)

      if (emailUpdate.error) {
        toast.error(t('vetProfile.toast.emailUpdateFailed', { error: emailUpdate.error }))
        return
      }

      toast.info(t('vetProfile.toast.emailConfirmationInfo'))
      return
    }

    setIsSavingProfile(false)
    onProfileUpdated(data)
    toast.success(t('vetProfile.toast.profileUpdated'))
  }

  const updateClinicAddressField = (field: keyof ClinicAddressFields, value: string) => {
    setProfileForm((current) => ({
      ...current,
      clinicAddress: {
        ...current.clinicAddress,
        [field]: value,
      },
    }))
  }

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newPassword.length < 6) {
      toast.error(t('vetProfile.validation.passwordMinLength'))
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('vetProfile.validation.passwordMismatch'))
      return
    }

    setIsSavingPassword(true)
    const { error } = await updateUserPassword(newPassword)
    setIsSavingPassword(false)

    if (error) {
      toast.error(error)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    toast.success(t('vetProfile.toast.passwordUpdated'))
  }

  return (
    <section className="section profile-layout">
      <article className="profile-panel">
        <h2>{t('vetProfile.title')}</h2>
        <form className="form" onSubmit={handleSaveProfile}>
          <p className="muted small">
            {t('common.requiredFieldsPrefix')} <span className="field-required">*</span> {t('common.requiredFieldsSuffix')}
          </p>

          <div className="grid two">
            <label>
              <span className="field-label">
                {t('common.fields.fullName')} <span className="field-required">*</span>
              </span>
              <input
                required
                value={profileForm.fullName}
                onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
              />
            </label>
            <label>
              <span className="field-label">
                CRMV <span className="field-required">*</span>
              </span>
              <input
                required
                value={profileForm.crmv}
                onChange={(event) => setProfileForm((current) => ({ ...current, crmv: event.target.value }))}
              />
            </label>
          </div>

          <div className="grid two">
            <label>
              <span className="field-label">
                {t('common.fields.cpf')} <span className="field-required">*</span>
              </span>
              <input
                required
                inputMode="numeric"
                maxLength={14}
                placeholder="000.000.000-00"
                value={profileForm.ssn}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, ssn: formatSsn(event.target.value) }))
                }
              />
            </label>
            <label>
              <span className="field-label">
                {t('common.fields.phone')} <span className="field-required">*</span>
              </span>
              <input
                required
                inputMode="numeric"
                maxLength={15}
                placeholder="(00) 00000-0000"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, phone: formatPhone(event.target.value) }))
                }
              />
            </label>
          </div>

          <div className="grid two">
            <label>
              <span className="field-label">
                {t('common.fields.email')} <span className="field-required">*</span>
              </span>
              <input
                required
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label>
              <span className="field-label">
                {t('common.fields.workMode')} <span className="field-required">*</span>
              </span>
              <select
                required
                value={profileForm.professionalType}
                onChange={(event) => {
                  const nextProfessionalType = event.target.value as VetProfessionalType | ''
                  setProfileForm((current) => ({
                    ...current,
                    professionalType: nextProfessionalType,
                    clinicName: nextProfessionalType === 'clinic' ? current.clinicName : '',
                    clinicAddress:
                      nextProfessionalType === 'clinic' ? current.clinicAddress : createEmptyClinicAddressFields(),
                  }))
                }}
              >
                <option value="">{t('common.select')}</option>
                <option value="clinic">{t('common.workMode.clinic')}</option>
                <option value="independent">{t('common.workMode.independent')}</option>
              </select>
            </label>
          </div>

          {profileForm.professionalType === 'clinic' ? (
            <>
              <label>
                <span className="field-label">
                  {t('common.fields.clinicName')} <span className="field-required">*</span>
                </span>
                <input
                  required
                  value={profileForm.clinicName}
                  onChange={(event) => setProfileForm((current) => ({ ...current, clinicName: event.target.value }))}
                />
              </label>

              <section className="form-subsection">
                <div className="form-subsection-header">
                  <div>
                    <h3>{t('common.fields.clinicAddress')}</h3>
                    <p className="muted small">{t('vetProfile.clinicAddressHelp')}</p>
                  </div>
                </div>

                <div className="grid address-grid-line-one">
                  <label>
                    <span className="field-label">
                      {t('common.fields.street')} <span className="field-required">*</span>
                    </span>
                    <input
                      required
                      value={profileForm.clinicAddress.street}
                      onChange={(event) => updateClinicAddressField('street', event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="field-label">
                      {t('common.fields.number')} <span className="field-required">*</span>
                    </span>
                    <input
                      required
                      value={profileForm.clinicAddress.number}
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
                      value={profileForm.clinicAddress.neighborhood}
                      onChange={(event) => updateClinicAddressField('neighborhood', event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="field-label">
                      {t('common.fields.city')} <span className="field-required">*</span>
                    </span>
                    <input
                      required
                      value={profileForm.clinicAddress.city}
                      onChange={(event) => updateClinicAddressField('city', event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="field-label">
                      {t('common.fields.state')} <span className="field-required">*</span>
                    </span>
                    <select
                      required
                      value={profileForm.clinicAddress.state}
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

          <button disabled={isSavingProfile} type="submit">
            {isSavingProfile ? t('vetProfile.submit.savingProfile') : t('vetProfile.submit.saveProfile')}
          </button>
        </form>
      </article>

      <article className="profile-panel">
        <h2>{t('vetProfile.security.title')}</h2>
        <form className="form" onSubmit={handleChangePassword}>
          <label>
            {t('vetProfile.security.newPassword')}
            <input
              minLength={6}
              required
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label>
            {t('vetProfile.security.confirmPassword')}
            <input
              minLength={6}
              required
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <button disabled={isSavingPassword} type="submit">
            {isSavingPassword ? t('vetProfile.submit.updatingPassword') : t('vetProfile.submit.updatePassword')}
          </button>
        </form>
      </article>
    </section>
  )
}
