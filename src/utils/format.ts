import type { SelectedExam } from '../types/app'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

export function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function parseSelectedExams(value: unknown): SelectedExam[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (
        typeof item === 'object' &&
        item !== null &&
        'exam_id' in item &&
        'exam_name' in item &&
        'unit_price' in item
      ) {
        const exam = item as { exam_id: number; exam_name: string; unit_price: number }
        return {
          exam_id: exam.exam_id,
          exam_name: exam.exam_name,
          unit_price: exam.unit_price,
        } as SelectedExam
      }
      return null
    })
    .filter((item): item is SelectedExam => item !== null)
}

export function formatDoctorName(fullName: string | null): string {
  const baseName = fullName?.trim() || 'Doctor'
  return /^dr\.?/i.test(baseName) ? baseName : `Dr. ${baseName}`
}

export function toDigitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatSsn(value: string): string {
  const digits = toDigitsOnly(value).slice(0, 11)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatPhone(value: string): string {
  const digits = toDigitsOnly(value).slice(0, 11)

  if (digits.length <= 2) {
    return digits ? `(${digits}` : ''
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function formatInternationalPhone(value: string): string {
  const digits = toDigitsOnly(value).slice(0, 13)

  if (digits.length === 0) {
    return ''
  }

  if (digits.length <= 2) {
    return `+${digits}`
  }

  if (digits.length <= 4) {
    return `+${digits.slice(0, 2)} (${digits.slice(2)}`
  }

  if (digits.length <= 9) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`
  }

  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
}
