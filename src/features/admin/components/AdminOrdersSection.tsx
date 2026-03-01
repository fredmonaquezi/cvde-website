import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../../components/toast/useToast'
import StatusBadge from '../../../components/StatusBadge'
import { updateDriverPhoneSetting, updateOrder } from '../../../services/adminService'
import type { ExamOrder, OrderEdit, OrderStatus } from '../../../types/app'
import { formatCurrency, formatDateTime, formatInternationalPhone, toDateTimeLocalValue, toDigitsOnly } from '../../../utils/format'

type AdminOrdersSectionProps = {
  driverPhone: string | null
  orders: ExamOrder[]
  onDataChanged: () => Promise<void>
}

type CollectionTrackingState = {
  bannerClassName: string
  bannerText: string
  isOverdue: boolean
}

function getCollectionDeadlineMs(driverRequestedAt: string | null): number | null {
  if (!driverRequestedAt) {
    return null
  }

  return new Date(driverRequestedAt).getTime() + 60 * 60 * 1000
}

function formatMinutesLabel(minutes: number): string {
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

function getCollectionTrackingState(
  requestCollection: boolean,
  driverCollectionRequested: boolean,
  driverRequestedAt: string | null,
  sampleReceivedAt: string | null,
  nowMs: number,
): CollectionTrackingState {
  if (!requestCollection) {
    return {
      bannerClassName: 'collection-banner collection-banner-none',
      bannerText: 'No collection requested for this order.',
      isOverdue: false,
    }
  }

  if (!driverCollectionRequested || !driverRequestedAt) {
    return {
      bannerClassName: 'collection-banner collection-banner-requested',
      bannerText: 'Collection requested by vet. Driver still needs to be contacted.',
      isOverdue: false,
    }
  }

  const deadlineMs = getCollectionDeadlineMs(driverRequestedAt)
  if (!deadlineMs) {
    return {
      bannerClassName: 'collection-banner collection-banner-requested',
      bannerText: 'Collection requested by vet. Driver still needs to be contacted.',
      isOverdue: false,
    }
  }

  if (sampleReceivedAt) {
    const receivedMs = new Date(sampleReceivedAt).getTime()
    const deltaMinutes = Math.max(0, Math.ceil(Math.abs(receivedMs - deadlineMs) / 60000))

    if (receivedMs <= deadlineMs) {
      return {
        bannerClassName: 'collection-banner collection-banner-complete',
        bannerText:
          deltaMinutes === 0
            ? 'Sample received at clinic within the 1-hour target.'
            : `Sample received at clinic with ${formatMinutesLabel(deltaMinutes)} remaining.`,
        isOverdue: false,
      }
    }

    return {
      bannerClassName: 'collection-banner collection-banner-overdue',
      bannerText: `Sample received late, ${formatMinutesLabel(deltaMinutes)} after the 1-hour target.`,
      isOverdue: false,
    }
  }

  const remainingMs = deadlineMs - nowMs
  if (remainingMs >= 0) {
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000))
    return {
      bannerClassName: 'collection-banner collection-banner-pending',
      bannerText: `Driver contacted. ${formatMinutesLabel(remainingMinutes)} remaining to receive the sample.`,
      isOverdue: false,
    }
  }

  const overdueMinutes = Math.max(1, Math.ceil(Math.abs(remainingMs) / 60000))
  return {
    bannerClassName: 'collection-banner collection-banner-overdue',
    bannerText: `Collection overdue by ${formatMinutesLabel(overdueMinutes)}. Contact the driver again.`,
    isOverdue: true,
  }
}

function buildDriverWhatsAppMessage(order: ExamOrder): string {
  const examList = order.selected_exams.map((exam) => exam.exam_name).join(', ')
  const clinicName =
    order.vet_clinic_name?.trim() ||
    (order.vet_professional_type === 'independent' ? 'Independent Professional' : 'Clinic not informed')
  const clinicAddress = order.vet_clinic_address?.trim()
  const patientInfo = [
    order.patient_name,
    order.species ? `Species: ${order.species}` : null,
    order.breed ? `Breed: ${order.breed}` : null,
    order.age_years !== null ? `Age: ${order.age_years}` : null,
  ]
    .filter(Boolean)
    .join(' | ')

  return [
    `CVDE Collection Request - Order #${order.id}`,
    `*${clinicName.toUpperCase()}*`,
    clinicAddress ? `Address: ${clinicAddress}` : null,
    '',
    `Vet: ${order.vet_name_snapshot ?? 'Not informed'}`,
    `Vet email: ${order.vet_email_snapshot ?? 'Not informed'}`,
    `Owner: ${order.owner_name}`,
    `Owner phone: ${order.owner_phone ?? 'Not informed'}`,
    `Patient: ${patientInfo}`,
    `Exams: ${examList || 'Not informed'}`,
    '',
    `Please collect the sample at the requesting clinic.`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')
}

function buildDriverReminderWhatsAppMessage(order: ExamOrder): string {
  return [
    `CVDE Reminder - Order #${order.id}`,
    `This collection is overdue.`,
    `Patient: ${order.patient_name}`,
    `Owner: ${order.owner_name}`,
    `Please send an update and prioritize delivery to the clinic.`,
  ].join('\n')
}

function buildDriverWhatsAppUrl(driverPhone: string, order: ExamOrder): string {
  const digits = toDigitsOnly(driverPhone)
  const message = buildDriverWhatsAppMessage(order)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

function buildDriverReminderWhatsAppUrl(driverPhone: string, order: ExamOrder): string {
  const digits = toDigitsOnly(driverPhone)
  const message = buildDriverReminderWhatsAppMessage(order)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default function AdminOrdersSection({ driverPhone, orders, onDataChanged }: AdminOrdersSectionProps) {
  const [orderEdits, setOrderEdits] = useState<Record<number, OrderEdit>>({})
  const [driverPhoneInput, setDriverPhoneInput] = useState(formatInternationalPhone(driverPhone ?? ''))
  const [isSavingDriverPhone, setIsSavingDriverPhone] = useState(false)
  const [collectionSavingByOrder, setCollectionSavingByOrder] = useState<Record<number, boolean>>({})
  const [nowMs, setNowMs] = useState(() => Date.now())
  const toast = useToast()

  useEffect(() => {
    const nextOrderEdits: Record<number, OrderEdit> = {}
    orders.forEach((order) => {
      nextOrderEdits[order.id] = {
        status: order.status,
        scheduled_for: toDateTimeLocalValue(order.scheduled_for),
        admin_notes: order.admin_notes ?? '',
        driver_collection_requested: order.driver_collection_requested,
        driver_requested_at: order.driver_requested_at,
        sample_received_at: order.sample_received_at,
      }
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderEdits(nextOrderEdits)
  }, [orders])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDriverPhoneInput(formatInternationalPhone(driverPhone ?? ''))
  }, [driverPhone])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 60000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [])

  const saveOrder = async (orderId: number) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order) {
      return
    }

    const { error } = await persistOrderUpdate(order)
    if (error) {
      toast.error(error)
      return
    }

    toast.success('Order updated.')
    await onDataChanged()
  }

  const saveDriverPhone = async () => {
    if (toDigitsOnly(driverPhoneInput).length !== 13) {
      toast.error('Driver phone must have 13 digits in the format +00 (00) 00000-0000.')
      return
    }

    setIsSavingDriverPhone(true)
    const { error } = await updateDriverPhoneSetting(driverPhoneInput.trim())
    setIsSavingDriverPhone(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Driver phone saved.')
    await onDataChanged()
  }

  const hasValidDriverPhone = toDigitsOnly(driverPhoneInput).length === 13
  const normalizedDriverPhone = useMemo(() => driverPhoneInput.trim(), [driverPhoneInput])

  const persistOrderUpdate = async (
    order: ExamOrder,
    overrides?: Partial<Pick<OrderEdit, 'driver_collection_requested' | 'driver_requested_at' | 'sample_received_at'>>,
  ) => {
    const edit = orderEdits[order.id]
    const nextEdit: OrderEdit = {
      status: edit?.status ?? order.status,
      scheduled_for: edit?.scheduled_for ?? toDateTimeLocalValue(order.scheduled_for),
      admin_notes: edit?.admin_notes ?? order.admin_notes ?? '',
      driver_collection_requested:
        overrides?.driver_collection_requested ?? edit?.driver_collection_requested ?? order.driver_collection_requested,
      driver_requested_at: overrides?.driver_requested_at ?? edit?.driver_requested_at ?? order.driver_requested_at,
      sample_received_at: overrides?.sample_received_at ?? edit?.sample_received_at ?? order.sample_received_at,
    }

    const result = await updateOrder({
      orderId: order.id,
      status: nextEdit.status,
      scheduledFor: nextEdit.scheduled_for ? new Date(nextEdit.scheduled_for).toISOString() : null,
      adminNotes: nextEdit.admin_notes.trim() || null,
      driverCollectionRequested: nextEdit.driver_collection_requested,
      driverRequestedAt: nextEdit.driver_requested_at,
      sampleReceivedAt: nextEdit.sample_received_at,
    })

    if (!result.error) {
      setOrderEdits((previous) => ({
        ...previous,
        [order.id]: nextEdit,
      }))
    }

    return result
  }

  const handleDriverCollectionToggle = async (order: ExamOrder, checked: boolean) => {
    setCollectionSavingByOrder((previous) => ({
      ...previous,
      [order.id]: true,
    }))

    const timestamp = checked ? new Date().toISOString() : null
    const { error } = await persistOrderUpdate(order, {
      driver_collection_requested: checked,
      driver_requested_at: timestamp,
      sample_received_at: checked ? orderEdits[order.id]?.sample_received_at ?? order.sample_received_at : null,
    })

    setCollectionSavingByOrder((previous) => ({
      ...previous,
      [order.id]: false,
    }))

    if (error) {
      toast.error(error)
      return
    }

    toast.success(checked ? 'Driver request saved.' : 'Driver request cleared.')
  }

  const handleMarkSampleReceived = async (order: ExamOrder) => {
    setCollectionSavingByOrder((previous) => ({
      ...previous,
      [order.id]: true,
    }))

    const { error } = await persistOrderUpdate(order, {
      sample_received_at: new Date().toISOString(),
    })

    setCollectionSavingByOrder((previous) => ({
      ...previous,
      [order.id]: false,
    }))

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Sample receipt saved.')
  }

  return (
    <section className="section">
      <h2>All Exam Orders</h2>
      <section className="driver-settings-card">
        <h3>Driver Settings</h3>
        <p className="muted small">Save the driver WhatsApp number once. This will be used for all collection requests.</p>
        <div className="driver-settings-row">
          <label>
            Driver Phone Number
            <input
              inputMode="numeric"
              maxLength={19}
              placeholder="+55 (11) 99999-9999"
              value={driverPhoneInput}
              onChange={(event) => setDriverPhoneInput(formatInternationalPhone(event.target.value))}
            />
          </label>
          <button type="button" onClick={() => void saveDriverPhone()} disabled={isSavingDriverPhone}>
            {isSavingDriverPhone ? 'Saving...' : 'Save Driver Phone'}
          </button>
        </div>
      </section>

      {orders.length === 0 ? <p>No orders yet.</p> : null}

      <div className="order-list">
        {orders.map((order) => {
          const edit = orderEdits[order.id]
          const isSavingCollection = collectionSavingByOrder[order.id] ?? false
          const neuterLabel = order.neuter_status ? order.neuter_status.replace('_', ' ') : 'not provided'
          const reactiveLabel = order.reactive_status ? order.reactive_status.replace('_', ' ') : 'not provided'
          const isDriverCollectionRequested = edit?.driver_collection_requested ?? order.driver_collection_requested
          const driverRequestedAt = edit?.driver_requested_at ?? order.driver_requested_at
          const sampleReceivedAt = edit?.sample_received_at ?? order.sample_received_at
          const collectionState = getCollectionTrackingState(
            order.request_collection,
            isDriverCollectionRequested,
            driverRequestedAt,
            sampleReceivedAt,
            nowMs,
          )

          return (
            <article className="order-card" key={order.id}>
              <div className="order-card-head">
                <h3>Order #{order.id}</h3>
                <StatusBadge status={order.status} />
              </div>

              <div className={collectionState.bannerClassName}>
                <strong>{collectionState.bannerText}</strong>
              </div>

              <p className="small muted">
                Created: {formatDateTime(order.created_at)} | Vet: {order.vet_name_snapshot ?? 'Unknown'} ({order.vet_email_snapshot ?? '-'})
              </p>

              <p>
                <strong>CRMV:</strong> {order.vet_crmv_snapshot ?? '-'}
              </p>

              <p>
                <strong>Clinic:</strong>{' '}
                {order.vet_clinic_name ??
                  (order.vet_professional_type === 'independent' ? 'Independent Professional' : 'Clinic not informed')}
              </p>

              <p>
                <strong>Clinic address:</strong> {order.vet_clinic_address ?? '-'}
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
                <strong>Request collection:</strong> {order.request_collection ? 'Yes' : 'No'}
              </p>

              {driverRequestedAt ? (
                <p>
                  <strong>Driver requested at:</strong> {formatDateTime(driverRequestedAt)}
                </p>
              ) : null}

              {sampleReceivedAt ? (
                <p>
                  <strong>Sample received at clinic:</strong> {formatDateTime(sampleReceivedAt)}
                </p>
              ) : null}

              {order.request_collection ? (
                <>
                  <label className="checkbox-field admin-collection-check">
                    <input
                      checked={isDriverCollectionRequested}
                      disabled={isSavingCollection}
                      type="checkbox"
                      onChange={(event) => void handleDriverCollectionToggle(order, event.target.checked)}
                    />
                    <span className="field-label">
                      {isSavingCollection ? 'Saving collection status...' : 'Requested the driver to collect'}
                    </span>
                  </label>

                  <div className="row-actions">
                  {hasValidDriverPhone ? (
                    <a
                      className="button-link"
                      href={buildDriverWhatsAppUrl(normalizedDriverPhone, order)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open WhatsApp for Driver
                    </a>
                  ) : (
                      <button className="secondary" disabled type="button">
                        Save driver phone to enable WhatsApp
                      </button>
                    )}

                    {isDriverCollectionRequested && !sampleReceivedAt ? (
                      <button
                        className="secondary"
                        disabled={isSavingCollection}
                        type="button"
                        onClick={() => void handleMarkSampleReceived(order)}
                      >
                        {isSavingCollection ? 'Saving...' : 'Mark Sample Received at Clinic'}
                      </button>
                    ) : null}

                    {collectionState.isOverdue && hasValidDriverPhone ? (
                      <a
                        className="button-link warning"
                        href={buildDriverReminderWhatsAppUrl(normalizedDriverPhone, order)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open WhatsApp Reminder
                      </a>
                    ) : null}
                  </div>
                </>
              ) : null}

              <p>
                <strong>Exams:</strong> {order.selected_exams.map((exam) => exam.exam_name).join(', ')}
              </p>

              <p>
                <strong>Total:</strong> {formatCurrency(order.total_value)}
              </p>

              <div className="grid two">
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
                          driver_collection_requested: edit?.driver_collection_requested ?? order.driver_collection_requested,
                          driver_requested_at: edit?.driver_requested_at ?? order.driver_requested_at,
                          sample_received_at: edit?.sample_received_at ?? order.sample_received_at,
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
                          driver_collection_requested: edit?.driver_collection_requested ?? order.driver_collection_requested,
                          driver_requested_at: edit?.driver_requested_at ?? order.driver_requested_at,
                          sample_received_at: edit?.sample_received_at ?? order.sample_received_at,
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
