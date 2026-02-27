import { supabase } from '../lib/supabase'
import type { ExamCatalogItem, ExamOrder, FaqEntry, OrderStatus } from '../types/app'
import { parseSelectedExams } from '../utils/format'
import type { ServiceMutationResult, ServiceResult } from './types'

export type AdminDashboardData = {
  examCatalog: ExamCatalogItem[]
  orders: ExamOrder[]
  faqEntries: FaqEntry[]
}

export type UpdateOrderInput = {
  orderId: number
  status: OrderStatus
  scheduledFor: string | null
  adminNotes: string | null
}

export type CreateExamInput = {
  name: string
  description: string | null
  currentPrice: number
}

export type UpdateExamDetailsInput = {
  examId: number
  name: string
  description: string | null
  active: boolean
}

export type UpdateExamPriceInput = {
  examId: number
  currentPrice: number
}

export type CreateFaqInput = {
  question: string
  answer: string
  category: string | null
}

export async function fetchAdminDashboardData(): Promise<ServiceResult<AdminDashboardData>> {
  const [{ data: examData, error: examError }, { data: orderData, error: orderError }, { data: faqData, error: faqError }] =
    await Promise.all([
      supabase.from('exam_catalog').select('id, name, description, current_price, active').order('name'),
      supabase.from('exam_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('faq_entries').select('id, question, answer, category, active').order('id', { ascending: false }),
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

export async function updateOrder(input: UpdateOrderInput): Promise<ServiceMutationResult> {
  const payload = {
    status: input.status,
    scheduled_for: input.scheduledFor,
    admin_notes: input.adminNotes,
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
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.examId)

  return {
    error: error?.message ?? null,
  }
}

export async function updateExamPrice(input: UpdateExamPriceInput): Promise<ServiceMutationResult> {
  const { error } = await supabase
    .from('exam_catalog')
    .update({
      current_price: input.currentPrice,
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
