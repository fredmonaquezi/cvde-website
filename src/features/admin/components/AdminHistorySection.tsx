import { useMemo, useState } from 'react'
import type { ExamOrder } from '../../../types/app'
import { formatCurrency, formatDateTime } from '../../../utils/format'

type AdminHistorySectionProps = {
  orders: ExamOrder[]
}

type HistoryRange = '3d' | '7d' | '30d' | '90d' | '365d' | 'all'

type HistoryRow = {
  row_id: string
  order_id: number
  exam_name: string
  exam_value: number
  vet_name: string
  clinic_name: string
  created_at: string
}

const RANGE_LABELS: Record<HistoryRange, string> = {
  '3d': 'Last 3 days',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '365d': 'Last 12 months',
  all: 'All time',
}

function escapeCsvValue(value: string | number): string {
  const normalized = String(value)
  const escaped = normalized.replace(/"/g, '""')
  return `"${escaped}"`
}

function buildCsvContent(
  rows: HistoryRow[],
  options: {
    rangeLabel: string
    vetLabel: string
    clinicLabel: string
    examLabel: string
    generatedAt: string
    totalValue: string
  },
): string {
  const summaryRows = [
    ['Report', 'CVDE Exam History Export'],
    ['Generated At', options.generatedAt],
    ['Time Range', options.rangeLabel],
    ['Vet Filter', options.vetLabel],
    ['Clinic Filter', options.clinicLabel],
    ['Exam Filter', options.examLabel],
    ['Total Exam Items', rows.length],
    ['Total Value', options.totalValue],
    [],
    ['Order ID', 'Ordered At', 'Exam', 'Vet', 'Clinic', 'Value'],
  ]

  const detailRows = rows.map((row) => [
    row.order_id,
    formatDateTime(row.created_at),
    row.exam_name,
    row.vet_name,
    row.clinic_name,
    formatCurrency(row.exam_value),
  ])

  return [...summaryRows, ...detailRows]
    .map((line) => line.map((cell) => escapeCsvValue(cell)).join(','))
    .join('\r\n')
}

function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

function buildExportFileName(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return `cvde-exam-history-${year}-${month}-${day}-${hours}${minutes}.csv`
}

function getRangeStart(range: HistoryRange): number | null {
  const now = Date.now()

  switch (range) {
    case '3d':
      return now - 3 * 24 * 60 * 60 * 1000
    case '7d':
      return now - 7 * 24 * 60 * 60 * 1000
    case '30d':
      return now - 30 * 24 * 60 * 60 * 1000
    case '90d':
      return now - 90 * 24 * 60 * 60 * 1000
    case '365d':
      return now - 365 * 24 * 60 * 60 * 1000
    case 'all':
      return null
  }
}

export default function AdminHistorySection({ orders }: AdminHistorySectionProps) {
  const [range, setRange] = useState<HistoryRange>('3d')
  const [vetFilter, setVetFilter] = useState('all')
  const [clinicFilter, setClinicFilter] = useState('all')
  const [examFilter, setExamFilter] = useState('all')

  const allRows = useMemo<HistoryRow[]>(
    () =>
      orders
        .flatMap((order) =>
          order.selected_exams.map((exam, index) => ({
            row_id: `${order.id}-${exam.exam_id}-${index}`,
            order_id: order.id,
            exam_name: exam.exam_name,
            exam_value: exam.unit_price,
            vet_name: order.vet_name_snapshot ?? 'Unknown',
            clinic_name:
              order.vet_clinic_name ??
              (order.vet_professional_type === 'independent' ? 'Independent Professional' : 'Clinic not informed'),
            created_at: order.created_at,
          })),
        )
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),
    [orders],
  )

  const vetOptions = useMemo(
    () => Array.from(new Set(allRows.map((row) => row.vet_name))).sort((left, right) => left.localeCompare(right)),
    [allRows],
  )

  const clinicOptions = useMemo(
    () => Array.from(new Set(allRows.map((row) => row.clinic_name))).sort((left, right) => left.localeCompare(right)),
    [allRows],
  )

  const examOptions = useMemo(
    () => Array.from(new Set(allRows.map((row) => row.exam_name))).sort((left, right) => left.localeCompare(right)),
    [allRows],
  )

  const filteredRows = useMemo(() => {
    const rangeStart = getRangeStart(range)

    return allRows.filter((row) => {
      const createdAtMs = new Date(row.created_at).getTime()
      const matchesRange = rangeStart === null || createdAtMs >= rangeStart
      const matchesVet = vetFilter === 'all' || row.vet_name === vetFilter
      const matchesClinic = clinicFilter === 'all' || row.clinic_name === clinicFilter
      const matchesExam = examFilter === 'all' || row.exam_name === examFilter

      return matchesRange && matchesVet && matchesClinic && matchesExam
    })
  }, [allRows, range, vetFilter, clinicFilter, examFilter])

  const totalValue = filteredRows.reduce((sum, row) => sum + row.exam_value, 0)

  const topExams = useMemo(
    () =>
      Array.from(
        filteredRows.reduce((counts, row) => {
          counts.set(row.exam_name, (counts.get(row.exam_name) ?? 0) + 1)
          return counts
        }, new Map<string, number>()),
      )
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 5),
    [filteredRows],
  )

  const handleExportCsv = () => {
    const csvContent = buildCsvContent(filteredRows, {
      rangeLabel: RANGE_LABELS[range],
      vetLabel: vetFilter === 'all' ? 'All vets' : vetFilter,
      clinicLabel: clinicFilter === 'all' ? 'All clinics' : clinicFilter,
      examLabel: examFilter === 'all' ? 'All exams' : examFilter,
      generatedAt: new Date().toLocaleString(),
      totalValue: formatCurrency(totalValue),
    })

    downloadCsvFile(buildExportFileName(), csvContent)
  }

  return (
    <section className="section">
      <div className="history-header">
        <div>
          <h2>Exam History</h2>
          <p className="muted small">
            Starts on {RANGE_LABELS[range].toLowerCase()}. Use the filters to inspect popularity by period, vet, clinic, or exam
            type.
          </p>
        </div>
        <button type="button" onClick={handleExportCsv} disabled={filteredRows.length === 0}>
          Export Filtered CSV
        </button>
      </div>

      <div className="history-filters">
        <label>
          Time range
          <select value={range} onChange={(event) => setRange(event.target.value as HistoryRange)}>
            <option value="3d">Last 3 days</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last 12 months</option>
            <option value="all">All time</option>
          </select>
        </label>

        <label>
          Vet
          <select value={vetFilter} onChange={(event) => setVetFilter(event.target.value)}>
            <option value="all">All vets</option>
            {vetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Clinic
          <select value={clinicFilter} onChange={(event) => setClinicFilter(event.target.value)}>
            <option value="all">All clinics</option>
            {clinicOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Exam type
          <select value={examFilter} onChange={(event) => setExamFilter(event.target.value)}>
            <option value="all">All exams</option>
            {examOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="history-summary-grid">
        <article className="summary-card">
          <h3>{filteredRows.length}</h3>
          <p>Exam items in filtered range</p>
        </article>
        <article className="summary-card">
          <h3>{formatCurrency(totalValue)}</h3>
          <p>Total filtered value</p>
        </article>
        <article className="summary-card summary-card-wide">
          <h3>Most popular exams</h3>
          {topExams.length === 0 ? (
            <p>No exam data in this filter.</p>
          ) : (
            <div className="popularity-list">
              {topExams.map(([examName, count]) => (
                <p key={examName}>
                  <strong>{examName}</strong>: {count}
                </p>
              ))}
            </div>
          )}
        </article>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Vet</th>
              <th>Clinic</th>
              <th>Ordered At</th>
              <th>Value</th>
              <th>Order</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6}>No exam history found for the selected filters.</td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.row_id}>
                  <td>{row.exam_name}</td>
                  <td>{row.vet_name}</td>
                  <td>{row.clinic_name}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                  <td>{formatCurrency(row.exam_value)}</td>
                  <td>#{row.order_id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
