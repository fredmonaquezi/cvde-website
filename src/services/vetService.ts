import { supabase } from '../lib/supabase'
import type { ExamCatalogItem, ExamOrder, FaqEntry, SelectedExam } from '../types/app'
import { parseSelectedExams } from '../utils/format'
import type { ServiceMutationResult, ServiceResult } from './types'

export type VetDashboardData = {
  examCatalog: ExamCatalogItem[]
  orders: ExamOrder[]
  faqEntries: FaqEntry[]
}

export type CreateVetExamOrderInput = {
  vetId: string
  vetNameSnapshot: string | null
  vetEmailSnapshot: string | null
  vetCrmvSnapshot: string | null
  vetClinicName: string | null
  vetClinicAddress: string | null
  vetProfessionalType: 'clinic' | 'independent' | null
  ownerName: string
  ownerSsn: string
  ownerPhone: string
  ownerAddress: string | null
  patientName: string
  species: string | null
  breed: string | null
  ageYears: number | null
  weightKg: number | null
  neuterStatus: 'neutered' | 'not_neutered' | 'unknown' | null
  reactiveStatus: 'reactive' | 'not_reactive' | null
  requestCollection: boolean
  selectedExams: SelectedExam[]
  totalValue: number
}

export async function fetchVetDashboardData(): Promise<ServiceResult<VetDashboardData>> {
  const [examResponse, orderResponse, faqResponse] = await Promise.all([
    supabase.from('exam_catalog').select('id, name, description, category, current_price, active').eq('active', true).order('category').order('name'),
    supabase.from('exam_orders').select('*').order('created_at', { ascending: false }),
    supabase
      .from('faq_entries')
      .select('id, question, answer, category, active')
      .eq('active', true)
      .order('id', { ascending: false }),
  ])

  let examData = examResponse.data
  let examError = examResponse.error
  const orderData = orderResponse.data
  const orderError = orderResponse.error
  const faqData = faqResponse.data
  const faqError = faqResponse.error

  if (examError && examError.message.toLowerCase().includes('does not exist')) {
    const fallback = await supabase
      .from('exam_catalog')
      .select('id, name, description, current_price, active')
      .eq('active', true)
      .order('name')

    examData = (fallback.data ?? []).map((exam) => ({
      ...exam,
      category: null,
    }))
    examError = fallback.error
  }

  if (examError || orderError || faqError) {
    return {
      data: null,
      error: examError?.message ?? orderError?.message ?? faqError?.message ?? 'Failed to load data.',
    }
  }

  const parsedOrders = (orderData ?? []).map((item) => ({
    ...item,
    vet_crmv_snapshot: item.vet_crmv_snapshot ?? null,
    vet_clinic_name: item.vet_clinic_name ?? null,
    vet_clinic_address: item.vet_clinic_address ?? null,
    vet_professional_type: item.vet_professional_type ?? null,
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
    },
    error: null,
  }
}

export async function createVetExamOrder(input: CreateVetExamOrderInput): Promise<ServiceMutationResult> {
  const { error } = await supabase.from('exam_orders').insert({
    vet_id: input.vetId,
    vet_name_snapshot: input.vetNameSnapshot,
    vet_email_snapshot: input.vetEmailSnapshot,
    vet_crmv_snapshot: input.vetCrmvSnapshot,
    vet_clinic_name: input.vetClinicName,
    vet_clinic_address: input.vetClinicAddress,
    vet_professional_type: input.vetProfessionalType,
    owner_name: input.ownerName,
    owner_ssn: input.ownerSsn,
    owner_phone: input.ownerPhone,
    owner_address: input.ownerAddress,
    owner_email: null,
    patient_name: input.patientName,
    species: input.species,
    breed: input.breed,
    age_years: input.ageYears,
    weight_kg: input.weightKg,
    neuter_status: input.neuterStatus,
    reactive_status: input.reactiveStatus,
    request_collection: input.requestCollection,
    sex: null,
    clinical_notes: null,
    selected_exams: input.selectedExams,
    total_value: input.totalValue,
  })

  return {
    error: error?.message ?? null,
  }
}
