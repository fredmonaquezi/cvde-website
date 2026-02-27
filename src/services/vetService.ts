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
  ownerName: string
  ownerSsn: string
  ownerPhone: string
  ownerAddress: string | null
  patientName: string
  species: string | null
  breed: string | null
  ageYears: number | null
  weightKg: number | null
  neuterStatus: 'neutered' | 'not_neutered' | 'unknown'
  reactiveStatus: 'reactive' | 'not_reactive'
  selectedExams: SelectedExam[]
  totalValue: number
}

export async function fetchVetDashboardData(): Promise<ServiceResult<VetDashboardData>> {
  const [{ data: examData, error: examError }, { data: orderData, error: orderError }, { data: faqData, error: faqError }] =
    await Promise.all([
      supabase.from('exam_catalog').select('id, name, description, current_price, active').eq('active', true).order('name'),
      supabase.from('exam_orders').select('*').order('created_at', { ascending: false }),
      supabase
        .from('faq_entries')
        .select('id, question, answer, category, active')
        .eq('active', true)
        .order('id', { ascending: false }),
    ])

  if (examError || orderError || faqError) {
    return {
      data: null,
      error: examError?.message ?? orderError?.message ?? faqError?.message ?? 'Failed to load data.',
    }
  }

  const parsedOrders = (orderData ?? []).map((item) => ({
    ...item,
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
    sex: null,
    clinical_notes: null,
    selected_exams: input.selectedExams,
    total_value: input.totalValue,
  })

  return {
    error: error?.message ?? null,
  }
}
