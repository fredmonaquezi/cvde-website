import type { Profile } from '../types/app'

function hasValue(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0)
}

export function isVetRegistrationComplete(profile: Profile): boolean {
  if (profile.role !== 'vet_user') {
    return true
  }

  if (profile.registration_completed) {
    return true
  }

  const hasBasics =
    hasValue(profile.full_name) &&
    hasValue(profile.crmv) &&
    hasValue(profile.ssn) &&
    hasValue(profile.phone) &&
    Boolean(profile.professional_type)

  if (!hasBasics) {
    return false
  }

  if (profile.professional_type === 'clinic') {
    return hasValue(profile.clinic_name)
  }

  return true
}
