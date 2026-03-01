import StatusBadge from '../../../components/StatusBadge'
import type { ExamOrder } from '../../../types/app'
import { formatCurrency, formatDateTime } from '../../../utils/format'

type VetHistorySectionProps = {
  orders: ExamOrder[]
}

export default function VetHistorySection({ orders }: VetHistorySectionProps) {
  return (
    <section className="section">
      <h2>My Exam History</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Owner</th>
              <th>Exams</th>
              <th>Total</th>
              <th>Status</th>
              <th>Scheduled</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7}>No exam orders yet.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{formatDateTime(order.created_at)}</td>
                  <td>
                    {order.patient_name}
                    <p className="small muted">
                      {order.species ?? 'Species not provided'}
                      {order.breed ? ` / ${order.breed}` : ''}
                    </p>
                  </td>
                  <td>{order.owner_name}</td>
                  <td>{order.selected_exams.map((exam) => exam.exam_name).join(', ')}</td>
                  <td>{formatCurrency(order.total_value)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>{formatDateTime(order.scheduled_for)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
