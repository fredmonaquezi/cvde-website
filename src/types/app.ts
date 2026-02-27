export type UserRole = 'vet_user' | 'admin_user'
export type VetTab = 'home' | 'order' | 'history' | 'prices' | 'faq' | 'profile'
export type AdminTab = 'orders' | 'prices' | 'faq'
export type OrderStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type VetProfessionalType = 'clinic' | 'independent'

export type Profile = {
  id: string
  full_name: string | null
  role: UserRole
  crmv: string | null
  ssn: string | null
  phone: string | null
  professional_type: VetProfessionalType | null
  clinic_name: string | null
  registration_completed: boolean
}

export type ExamCatalogItem = {
  id: number
  name: string
  description: string | null
  current_price: number
  active: boolean
}

export type SelectedExam = {
  exam_id: number
  exam_name: string
  unit_price: number
  quantity: number
  line_total: number
}

export type ExamOrder = {
  id: number
  vet_id: string
  vet_name_snapshot: string | null
  vet_email_snapshot: string | null
  owner_name: string
  owner_ssn: string
  owner_phone: string | null
  owner_address: string | null
  owner_email: string | null
  patient_name: string
  species: string | null
  breed: string | null
  age_years: number | null
  weight_kg: number | null
  neuter_status: 'neutered' | 'not_neutered' | 'unknown'
  reactive_status: 'reactive' | 'not_reactive'
  sex: string | null
  clinical_notes: string | null
  selected_exams: SelectedExam[]
  total_value: number
  status: OrderStatus
  scheduled_for: string | null
  admin_notes: string | null
  created_at: string
}

export type FaqEntry = {
  id: number
  question: string
  answer: string
  category: string | null
  active: boolean
}

export type OrderEdit = {
  status: OrderStatus
  scheduled_for: string
  admin_notes: string
}
