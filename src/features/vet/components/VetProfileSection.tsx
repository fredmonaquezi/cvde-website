import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../../../components/toast/useToast'
import { updateUserEmail, updateUserPassword, updateVetProfileDetails } from '../../../services/authService'
import type { Profile, VetProfessionalType } from '../../../types/app'
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
  clinicAddress: string
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
    clinicAddress: profile.clinic_address ?? '',
  }
}

export default function VetProfileSection({ profile, session, onProfileUpdated }: VetProfileSectionProps) {
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
    const trimmedClinicAddress = profileForm.clinicAddress.trim()

    if (
      !trimmedFullName ||
      !trimmedCrmv ||
      !trimmedSsn ||
      !trimmedPhone ||
      !trimmedEmail ||
      !profileForm.professionalType
    ) {
      toast.error('Please fill all required profile fields.')
      return
    }

    if (toDigitsOnly(trimmedSsn).length !== 11) {
      toast.error('Social Security Number must have 11 digits.')
      return
    }

    if (toDigitsOnly(trimmedPhone).length !== 11) {
      toast.error('Phone Number must have 11 digits.')
      return
    }

    if (profileForm.professionalType === 'clinic' && (!trimmedClinicName || !trimmedClinicAddress)) {
      toast.error('Please provide the clinic name and clinic address.')
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
      clinicAddress: profileForm.professionalType === 'clinic' ? trimmedClinicAddress : null,
    })

    if (error || !data) {
      setIsSavingProfile(false)
      toast.error(error ?? 'Failed to update profile.')
      return
    }

    const currentEmail = session.user.email?.trim() ?? ''
    const isEmailChanged = trimmedEmail !== currentEmail

    if (isEmailChanged) {
      const emailUpdate = await updateUserEmail(trimmedEmail)
      setIsSavingProfile(false)
      onProfileUpdated(data)

      if (emailUpdate.error) {
        toast.error(`Profile details were saved, but the email update failed: ${emailUpdate.error}`)
        return
      }

      toast.info('Profile updated. If email confirmation is enabled, confirm the new email from your inbox.')
      return
    }

    setIsSavingProfile(false)
    onProfileUpdated(data)
    toast.success('Profile updated successfully.')
  }

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newPassword.length < 6) {
      toast.error('Password must have at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password confirmation does not match.')
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
    toast.success('Password updated successfully.')
  }

  return (
    <section className="section profile-layout">
      <article className="profile-panel">
        <h2>Update Profile</h2>
        <form className="form" onSubmit={handleSaveProfile}>
          <p className="muted small">Fields with <span className="field-required">*</span> are required.</p>

          <div className="grid two">
            <label>
              <span className="field-label">
                Full Name <span className="field-required">*</span>
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
                Social Security Number <span className="field-required">*</span>
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
                Phone Number <span className="field-required">*</span>
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
                Email <span className="field-required">*</span>
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
                Work Mode <span className="field-required">*</span>
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
                    clinicAddress: nextProfessionalType === 'clinic' ? current.clinicAddress : '',
                  }))
                }}
              >
                <option value="">Select</option>
                <option value="clinic">Works at a clinic</option>
                <option value="independent">Independent professional</option>
              </select>
            </label>
          </div>

          {profileForm.professionalType === 'clinic' ? (
            <div className="grid two">
              <label>
                <span className="field-label">
                  Clinic Name <span className="field-required">*</span>
                </span>
                <input
                  required
                  value={profileForm.clinicName}
                  onChange={(event) => setProfileForm((current) => ({ ...current, clinicName: event.target.value }))}
                />
              </label>
              <label>
                <span className="field-label">
                  Clinic Address <span className="field-required">*</span>
                </span>
                <input
                  required
                  value={profileForm.clinicAddress}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, clinicAddress: event.target.value }))
                  }
                />
              </label>
            </div>
          ) : null}

          <button disabled={isSavingProfile} type="submit">
            {isSavingProfile ? 'Saving profile...' : 'Save Profile'}
          </button>
        </form>
      </article>

      <article className="profile-panel">
        <h2>Security</h2>
        <form className="form" onSubmit={handleChangePassword}>
          <label>
            New password
            <input
              minLength={6}
              required
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label>
            Confirm new password
            <input
              minLength={6}
              required
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <button disabled={isSavingPassword} type="submit">
            {isSavingPassword ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </article>
    </section>
  )
}
