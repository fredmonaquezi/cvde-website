import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useToast } from '../../../components/toast/useToast'
import { updateProfileName, updateUserPassword } from '../../../services/authService'
import type { Profile } from '../../../types/app'

type VetProfileSectionProps = {
  profile: Profile
  session: Session
  onProfileUpdated: (nextProfile: Profile) => void
}

export default function VetProfileSection({ profile, session, onProfileUpdated }: VetProfileSectionProps) {
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [profileNameInput, setProfileNameInput] = useState(profile.full_name ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const toast = useToast()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileNameInput(profile.full_name ?? '')
  }, [profile.full_name])

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = profileNameInput.trim()
    if (!trimmedName) {
      toast.error('Name is required.')
      return
    }

    setIsSavingProfile(true)
    const { error } = await updateProfileName(profile.id, trimmedName)
    setIsSavingProfile(false)

    if (error) {
      toast.error(error)
      return
    }

    onProfileUpdated({
      ...profile,
      full_name: trimmedName,
    })
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
          <label>
            Full name
            <input required value={profileNameInput} onChange={(event) => setProfileNameInput(event.target.value)} />
          </label>
          <label>
            Email
            <input readOnly value={session.user.email ?? ''} />
          </label>
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
