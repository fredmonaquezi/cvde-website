import { supabase } from '../lib/supabase'
import type { ExamCatalogItem, ExamOrder, FaqEntry, OrderStatus, VetProfessionalType } from '../types/app'
import { parseSelectedExams } from '../utils/format'
import type { ServiceMutationResult, ServiceResult } from './types'

export type AdminDashboardData = {
  examCatalog: ExamCatalogItem[]
  orders: ExamOrder[]
  faqEntries: FaqEntry[]
  driverPhone: string | null
}

export type UpdateOrderInput = {
  orderId: number
  status: OrderStatus
  scheduledFor: string | null
  adminNotes: string | null
  driverCollectionRequested: boolean
  driverRequestedAt: string | null
  sampleReceivedAt: string | null
}

export type CreateExamInput = {
  name: string
  description: string | null
  category: string | null
  currentPrice: number
}

export type UpdateExamDetailsInput = {
  examId: number
  name: string
  description: string | null
  category: string | null
  currentPrice: number
  active: boolean
}

export type CreateFaqInput = {
  question: string
  answer: string
  category: string | null
}

export async function fetchAdminDashboardData(): Promise<ServiceResult<AdminDashboardData>> {
  const [examResponse, orderResponse, faqResponse, settingsResponse] = await Promise.all([
    supabase.from('exam_catalog').select('id, name, description, category, current_price, active').order('category').order('name'),
    supabase
      .from('exam_orders')
      .select('*, vet_profile:profiles!exam_orders_vet_id_fkey(crmv, clinic_name, clinic_address, professional_type)')
      .order('created_at', { ascending: false }),
    supabase.from('faq_entries').select('id, question, answer, category, active').order('id', { ascending: false }),
    supabase.from('app_settings').select('setting_key, setting_value').eq('setting_key', 'driver_phone_number').maybeSingle(),
  ])

  let examData = examResponse.data
  let examError = examResponse.error
  const orderData = orderResponse.data
  const orderError = orderResponse.error
  const faqData = faqResponse.data
  const faqError = faqResponse.error
  const settingsData = settingsResponse.data
  let settingsError = settingsResponse.error

  if (examError && examError.message.toLowerCase().includes('does not exist')) {
    const fallback = await supabase.from('exam_catalog').select('id, name, description, current_price, active').order('name')

    examData = (fallback.data ?? []).map((exam) => ({
      ...exam,
      category: null,
    }))
    examError = fallback.error
  }

  if (settingsError && settingsError.message.toLowerCase().includes('does not exist')) {
    settingsError = null
  }

  if (examError || orderError || faqError || settingsError) {
    return {
      data: null,
      error: examError?.message ?? orderError?.message ?? faqError?.message ?? settingsError?.message ?? 'Failed to load data.',
    }
  }

  const parsedOrders = (orderData ?? []).map((item) => ({
    ...(item as Record<string, unknown>),
    vet_crmv_snapshot:
      ((item as { vet_crmv_snapshot?: string | null }).vet_crmv_snapshot ??
        (item as { vet_profile?: { crmv?: string | null } | null }).vet_profile?.crmv ??
        null) as string | null,
    vet_clinic_name:
      ((item as { vet_clinic_name?: string | null }).vet_clinic_name ??
        (item as { vet_profile?: { clinic_name?: string | null } | null }).vet_profile?.clinic_name ??
        null) as string | null,
    vet_clinic_address:
      ((item as { vet_clinic_address?: string | null }).vet_clinic_address ??
        (item as { vet_profile?: { clinic_address?: string | null } | null }).vet_profile?.clinic_address ??
        null) as string | null,
    vet_professional_type:
      ((item as { vet_professional_type?: VetProfessionalType | null }).vet_professional_type ??
        (item as { vet_profile?: { professional_type?: VetProfessionalType | null } | null }).vet_profile?.professional_type ??
        null) as VetProfessionalType | null,
    request_collection: Boolean(item.request_collection),
    driver_collection_requested: Boolean(item.driver_collection_requested),
    driver_requested_at: item.driver_requested_at ?? null,
    sample_received_at: item.sample_received_at ?? null,
    selected_exams: parseSelectedExams(item.selected_exams),
  })) as ExamOrder[]

  return {
    data: {
      examCatalog: (examData ?? []) as ExamCatalogItem[],
      orders: parsedOrders,
      faqEntries: (faqData ?? []) as FaqEntry[],
      driverPhone:
        settingsData && settingsData.setting_key === 'driver_phone_number'
          ? settingsData.setting_value
          : null,
    },
    error: null,
  }
}

export async function updateOrder(input: UpdateOrderInput): Promise<ServiceMutationResult> {
  const payload = {
    status: input.status,
    scheduled_for: input.scheduledFor,
    admin_notes: input.adminNotes,
    driver_collection_requested: input.driverCollectionRequested,
    driver_requested_at: input.driverRequestedAt,
    sample_received_at: input.sampleReceivedAt,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('exam_orders').update(payload).eq('id', input.orderId)

  return {
    error: error?.message ?? null,
  }
}

export async function createExam(input: CreateExamInput): Promise<ServiceMutationResult> {
  const { error } = await supabase.from('exam_catalog').insert({
    name: input.name,
    description: input.description,
    category: input.category,
    current_price: input.currentPrice,
    active: true,
    updated_at: new Date().toISOString(),
  })

  return {
    error: error?.message ?? null,
  }
}

export async function updateExamDetails(input: UpdateExamDetailsInput): Promise<ServiceMutationResult> {
  const { error } = await supabase
    .from('exam_catalog')
    .update({
      name: input.name,
      description: input.description,
      category: input.category,
      current_price: input.currentPrice,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.examId)

  return {
    error: error?.message ?? null,
  }
}

export async function toggleExamActive(examId: number, active: boolean): Promise<ServiceMutationResult> {
  const { error } = await supabase
    .from('exam_catalog')
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', examId)

  return {
    error: error?.message ?? null,
  }
}

export async function createFaqEntry(input: CreateFaqInput): Promise<ServiceMutationResult> {
  const { error } = await supabase.from('faq_entries').insert({
    question: input.question,
    answer: input.answer,
    category: input.category,
  })

  return {
    error: error?.message ?? null,
  }
}

export async function toggleFaqEntryActive(entryId: number, active: boolean): Promise<ServiceMutationResult> {
  const { error } = await supabase
    .from('faq_entries')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', entryId)

  return {
    error: error?.message ?? null,
  }
}

export async function updateDriverPhoneSetting(driverPhone: string): Promise<ServiceMutationResult> {
  const { error } = await supabase.from('app_settings').upsert(
    {
      setting_key: 'driver_phone_number',
      setting_value: driverPhone,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'setting_key',
    },
  )

  return {
    error: error?.message ?? null,
  }
}
