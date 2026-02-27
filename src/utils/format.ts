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
        'unit_price' in item &&
        'quantity' in item &&
        'line_total' in item
      ) {
        return item as SelectedExam
      }
      return null
    })
    .filter((item): item is SelectedExam => item !== null)
}

export function formatDoctorName(fullName: string | null): string {
  const baseName = fullName?.trim() || 'Doctor'
  return /^dr\.?/i.test(baseName) ? baseName : `Dr. ${baseName}`
}
