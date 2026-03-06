import StatusBadge from '../../../components/StatusBadge'
import { useI18n } from '../../../i18n'
import type { ExamOrder } from '../../../types/app'
import { formatCurrency, formatDateTime } from '../../../utils/format'

type VetHistorySectionProps = {
  orders: ExamOrder[]
}

export default function VetHistorySection({ orders }: VetHistorySectionProps) {
  const { t } = useI18n()

  return (
    <section className="section">
      <h2>{t('vetHistory.title')}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('vetHistory.table.date')}</th>
              <th>{t('vetHistory.table.patient')}</th>
              <th>{t('vetHistory.table.owner')}</th>
              <th>{t('vetHistory.table.exams')}</th>
              <th>{t('vetHistory.table.total')}</th>
              <th>{t('vetHistory.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6}>{t('vetHistory.empty')}</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{formatDateTime(order.created_at)}</td>
                  <td>
                    <strong>{order.patient_name}</strong>
                    <p className="small muted">
                      {order.species ?? t('vetHistory.speciesNotInformed')}
                      {order.breed ? ` / ${order.breed}` : ''}
                    </p>
                  </td>
                  <td>{order.owner_name}</td>
                  <td>{order.selected_exams.map((exam) => exam.exam_name).join(', ')}</td>
                  <td>{formatCurrency(order.total_value)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
