import { useEffect, useState } from 'react'
import { useToast } from '../../../components/toast/useToast'
import StatusBadge from '../../../components/StatusBadge'
import { updateOrder } from '../../../services/adminService'
import type { ExamOrder, OrderEdit, OrderStatus } from '../../../types/app'
import { formatCurrency, formatDateTime, toDateTimeLocalValue } from '../../../utils/format'

type AdminOrdersSectionProps = {
  orders: ExamOrder[]
  onDataChanged: () => Promise<void>
}

export default function AdminOrdersSection({ orders, onDataChanged }: AdminOrdersSectionProps) {
  const [orderEdits, setOrderEdits] = useState<Record<number, OrderEdit>>({})
  const toast = useToast()

  useEffect(() => {
    const nextOrderEdits: Record<number, OrderEdit> = {}
    orders.forEach((order) => {
      nextOrderEdits[order.id] = {
        status: order.status,
        scheduled_for: toDateTimeLocalValue(order.scheduled_for),
        admin_notes: order.admin_notes ?? '',
      }
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderEdits(nextOrderEdits)
  }, [orders])

  const saveOrder = async (orderId: number) => {
    const edit = orderEdits[orderId]
    if (!edit) {
      return
    }

    const { error } = await updateOrder({
      orderId,
      status: edit.status,
      scheduledFor: edit.scheduled_for ? new Date(edit.scheduled_for).toISOString() : null,
      adminNotes: edit.admin_notes.trim() || null,
    })
    if (error) {
      toast.error(error)
      return
    }

    toast.success('Order updated.')
    await onDataChanged()
  }

  return (
    <section className="section">
      <h2>All Exam Orders</h2>
      {orders.length === 0 ? <p>No orders yet.</p> : null}

      <div className="order-list">
        {orders.map((order) => {
          const edit = orderEdits[order.id]
          const neuterLabel = order.neuter_status ? order.neuter_status.replace('_', ' ') : 'unknown'
          const reactiveLabel = order.reactive_status ? order.reactive_status.replace('_', ' ') : 'not provided'
          return (
            <article className="order-card" key={order.id}>
              <div className="order-card-head">
                <h3>Order #{order.id}</h3>
                <StatusBadge status={order.status} />
              </div>

              <p className="small muted">
                Created: {formatDateTime(order.created_at)} | Vet: {order.vet_name_snapshot ?? 'Unknown'} ({order.vet_email_snapshot ?? '-'})
              </p>

              <p>
                <strong>Patient:</strong> {order.patient_name}
                {order.species ? ` (${order.species})` : ''}
                {order.breed ? `, ${order.breed}` : ''}
                {order.age_years !== null ? `, ${order.age_years}y` : ''}
                {order.weight_kg !== null ? `, ${order.weight_kg}kg` : ''}
              </p>

              <p>
                <strong>Neutered:</strong> {neuterLabel} | <strong>Reactive:</strong> {reactiveLabel}
              </p>

              <p>
                <strong>Owner:</strong> {order.owner_name} | <strong>SSN:</strong> {order.owner_ssn ?? '-'} | <strong>Phone:</strong>{' '}
                {order.owner_phone ?? '-'}
              </p>

              <p>
                <strong>Address:</strong> {order.owner_address ?? '-'}
              </p>

              <p>
                <strong>Exams:</strong> {order.selected_exams.map((exam) => `${exam.exam_name} x${exam.quantity}`).join(', ')}
              </p>

              <p>
                <strong>Total:</strong> {formatCurrency(order.total_value)}
              </p>

              <div className="grid three">
                <label>
                  Status
                  <select
                    value={edit?.status ?? order.status}
                    onChange={(event) =>
                      setOrderEdits((previous) => ({
                        ...previous,
                        [order.id]: {
                          status: event.target.value as OrderStatus,
                          scheduled_for: edit?.scheduled_for ?? toDateTimeLocalValue(order.scheduled_for),
                          admin_notes: edit?.admin_notes ?? order.admin_notes ?? '',
                        },
                      }))
                    }
                  >
                    <option value="requested">requested</option>
                    <option value="scheduled">scheduled</option>
                    <option value="in_progress">in progress</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </label>

                <label>
                  Scheduled for
                  <input
                    type="datetime-local"
                    value={edit?.scheduled_for ?? toDateTimeLocalValue(order.scheduled_for)}
                    onChange={(event) =>
                      setOrderEdits((previous) => ({
                        ...previous,
                        [order.id]: {
                          status: edit?.status ?? order.status,
                          scheduled_for: event.target.value,
                          admin_notes: edit?.admin_notes ?? order.admin_notes ?? '',
                        },
                      }))
                    }
                  />
                </label>

                <label>
                  Admin notes
                  <input
                    value={edit?.admin_notes ?? order.admin_notes ?? ''}
                    onChange={(event) =>
                      setOrderEdits((previous) => ({
                        ...previous,
                        [order.id]: {
                          status: edit?.status ?? order.status,
                          scheduled_for: edit?.scheduled_for ?? toDateTimeLocalValue(order.scheduled_for),
                          admin_notes: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              </div>

              <button className="secondary" type="button" onClick={() => void saveOrder(order.id)}>
                Save Order Update
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
