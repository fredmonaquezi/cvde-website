import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, VetProfessionalType } from '../types/app'
import type { ServiceMutationResult, ServiceResult } from './types'

type SignUpInput = {
  email: string
  password: string
  fullName: string
  emailRedirectTo: string
}

type SignUpResult = {
  needsEmailConfirmation: boolean
}

const PROFILE_SELECT_COLUMNS =
  'id, full_name, role, crmv, ssn, phone, professional_type, clinic_name, clinic_address, registration_completed'

const PROFILE_SELECT_COLUMNS_LEGACY =
  'id, full_name, role, crmv, ssn, phone, professional_type, clinic_name, registration_completed'

type CompleteVetRegistrationInput = {
  fullName: string
  crmv: string
  ssn: string
  phone: string
  professionalType: VetProfessionalType
  clinicName: string | null
  clinicAddress: string | null
}

type UpdateVetProfileInput = CompleteVetRegistrationInput

export async function signUpVetAccount({ email, password, fullName, emailRedirectTo }: SignUpInput): Promise<ServiceResult<SignUpResult>> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName.trim(),
      },
    },
  })

  if (error) {
    return {
      data: null,
      error: error.message,
    }
  }

  return {
    data: {
      needsEmailConfirmation: !data.session,
    },
    error: null,
  }
}

export async function signInWithEmailPassword(email: string, password: string): Promise<ServiceMutationResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return {
    error: error?.message ?? null,
  }
}

export async function signOutCurrentUser(): Promise<ServiceMutationResult> {
  const { error } = await supabase.auth.signOut()
  return {
    error: error?.message ?? null,
  }
}

export async function getCurrentSession(): Promise<ServiceResult<Session | null>> {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return {
      data: null,
      error: error.message,
    }
  }

  return {
    data: data.session,
    error: null,
  }
}

export function subscribeToAuthChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function fetchProfileByUserId(userId: string): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT_COLUMNS).eq('id', userId).single()

  if (error && error.message.toLowerCase().includes('does not exist')) {
    const legacy = await supabase.from('profiles').select(PROFILE_SELECT_COLUMNS_LEGACY).eq('id', userId).single()

    if (!legacy.error && legacy.data) {
      return {
        data: {
          ...(legacy.data as Omit<Profile, 'clinic_address'>),
          clinic_address: null,
        },
        error: null,
      }
    }

    // Backward compatibility before onboarding migration is applied.
    const fallback = await supabase.from('profiles').select('id, full_name, role').eq('id', userId).single()

    if (fallback.error) {
      return {
        data: null,
        error: fallback.error.message,
      }
    }

    const fallbackProfile = fallback.data as { id: string; full_name: string | null; role: 'vet_user' | 'admin_user' }
    return {
      data: {
        ...fallbackProfile,
        crmv: null,
        ssn: null,
        phone: null,
        professional_type: null,
        clinic_name: null,
        clinic_address: null,
        registration_completed: fallbackProfile.role === 'admin_user',
      },
      error: null,
    }
  }

  if (error) {
    return {
      data: null,
      error: error.message,
    }
  }

  return {
    data: data as Profile,
    error: null,
  }
}

export async function completeVetRegistration(
  userId: string,
  input: CompleteVetRegistrationInput,
): Promise<ServiceResult<Profile>> {
  return saveVetProfileDetails(userId, input, true)
}

export async function updateVetProfileDetails(
  userId: string,
  input: UpdateVetProfileInput,
): Promise<ServiceResult<Profile>> {
  return saveVetProfileDetails(userId, input, true)
}

async function saveVetProfileDetails(
  userId: string,
  input: UpdateVetProfileInput,
  registrationCompleted: boolean,
): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName,
      crmv: input.crmv,
      ssn: input.ssn,
      phone: input.phone,
      professional_type: input.professionalType,
      clinic_name: input.clinicName,
      clinic_address: input.clinicAddress,
      registration_completed: registrationCompleted,
    })
    .eq('id', userId)
    .select(PROFILE_SELECT_COLUMNS)
    .single()

  if (error) {
    return {
      data: null,
      error: error.message,
    }
  }

  return {
    data: data as Profile,
    error: null,
  }
}

export async function updateUserEmail(email: string): Promise<ServiceMutationResult> {
  const { error } = await supabase.auth.updateUser({ email })

  return {
    error: error?.message ?? null,
  }
}

export async function updateUserPassword(password: string): Promise<ServiceMutationResult> {
  const { error } = await supabase.auth.updateUser({ password })

  return {
    error: error?.message ?? null,
  }
}
