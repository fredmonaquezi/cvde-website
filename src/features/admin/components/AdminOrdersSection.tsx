import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../../components/toast/useToast'
import StatusBadge from '../../../components/StatusBadge'
import { useI18n } from '../../../i18n'
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

type CompactCollectionSummary = {
  label: string
  toneClassName: string
}

type TranslateFn = (key: string, values?: Record<string, string | number>) => string

function getCollectionDeadlineMs(driverRequestedAt: string | null): number | null {
  if (!driverRequestedAt) {
    return null
  }

  return new Date(driverRequestedAt).getTime() + 60 * 60 * 1000
}

function formatMinutesLabel(minutes: number, t: TranslateFn): string {
  return t('adminOrders.collection.minutesLabel', { minutes })
}

function getCollectionTrackingState(
  requestCollection: boolean,
  driverCollectionRequested: boolean,
  driverRequestedAt: string | null,
  sampleReceivedAt: string | null,
  nowMs: number,
  t: TranslateFn,
): CollectionTrackingState {
  if (!requestCollection) {
    return {
      bannerClassName: 'collection-banner collection-banner-none',
      bannerText: t('adminOrders.collection.banner.none'),
      isOverdue: false,
    }
  }

  if (!driverCollectionRequested || !driverRequestedAt) {
    return {
      bannerClassName: 'collection-banner collection-banner-requested',
      bannerText: t('adminOrders.collection.banner.requested'),
      isOverdue: false,
    }
  }

  const deadlineMs = getCollectionDeadlineMs(driverRequestedAt)
  if (!deadlineMs) {
    return {
      bannerClassName: 'collection-banner collection-banner-requested',
      bannerText: t('adminOrders.collection.banner.requested'),
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
            ? t('adminOrders.collection.banner.receivedOnTime')
            : t('adminOrders.collection.banner.receivedWithTimeLeft', { timeLeft: formatMinutesLabel(deltaMinutes, t) }),
        isOverdue: false,
      }
    }

    return {
      bannerClassName: 'collection-banner collection-banner-overdue',
      bannerText: t('adminOrders.collection.banner.receivedLate', { delay: formatMinutesLabel(deltaMinutes, t) }),
      isOverdue: false,
    }
  }

  const remainingMs = deadlineMs - nowMs
  if (remainingMs >= 0) {
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000))
    return {
      bannerClassName: 'collection-banner collection-banner-pending',
      bannerText: t('adminOrders.collection.banner.pending', { remaining: formatMinutesLabel(remainingMinutes, t) }),
      isOverdue: false,
    }
  }

  const overdueMinutes = Math.max(1, Math.ceil(Math.abs(remainingMs) / 60000))
  return {
    bannerClassName: 'collection-banner collection-banner-overdue',
    bannerText: t('adminOrders.collection.banner.overdue', { delay: formatMinutesLabel(overdueMinutes, t) }),
    isOverdue: true,
  }
}

function getCompactCollectionSummary(
  requestCollection: boolean,
  driverCollectionRequested: boolean,
  sampleReceivedAt: string | null,
  isOverdue: boolean,
  t: TranslateFn,
): CompactCollectionSummary {
  if (!requestCollection) {
    return {
      label: t('adminOrders.collection.summary.none'),
      toneClassName: 'is-neutral',
    }
  }

  if (sampleReceivedAt) {
    return {
      label: t('adminOrders.collection.summary.received'),
      toneClassName: 'is-success',
    }
  }

  if (isOverdue) {
    return {
      label: t('adminOrders.collection.summary.overdue'),
      toneClassName: 'is-danger',
    }
  }

  if (driverCollectionRequested) {
    return {
      label: t('adminOrders.collection.summary.driverContacted'),
      toneClassName: 'is-info',
    }
  }

  return {
    label: t('adminOrders.collection.summary.awaitingDriver'),
    toneClassName: 'is-warning',
  }
}

function buildDriverWhatsAppMessage(order: ExamOrder, t: TranslateFn): string {
  const examList = order.selected_exams.map((exam) => exam.exam_name).join(', ')
  const clinicName =
    order.vet_clinic_name?.trim() ||
    (order.vet_professional_type === 'independent'
      ? t('adminOrders.fallback.independentProfessional')
      : t('adminOrders.fallback.clinicNotInformed'))
  const clinicAddress = order.vet_clinic_address?.trim()
  const patientInfo = [
    order.patient_name,
    order.species ? t('adminOrders.whatsapp.species', { species: order.species }) : null,
    order.breed ? t('adminOrders.whatsapp.breed', { breed: order.breed }) : null,
    order.age_years !== null ? t('adminOrders.whatsapp.age', { age: order.age_years }) : null,
  ]
    .filter(Boolean)
    .join(' | ')

  return [
    t('adminOrders.whatsapp.collectionTitle', { orderId: order.id }),
    `*${clinicName.toUpperCase()}*`,
    clinicAddress ? t('adminOrders.whatsapp.address', { address: clinicAddress }) : null,
    '',
    t('adminOrders.whatsapp.vet', { vet: order.vet_name_snapshot ?? t('common.notInformed') }),
    t('adminOrders.whatsapp.vetEmail', { email: order.vet_email_snapshot ?? t('common.notInformed') }),
    t('adminOrders.whatsapp.owner', { owner: order.owner_name }),
    t('adminOrders.whatsapp.ownerPhone', { phone: order.owner_phone ?? t('common.notInformed') }),
    t('adminOrders.whatsapp.patient', { patient: patientInfo }),
    t('adminOrders.whatsapp.exams', { exams: examList || t('common.notInformed') }),
    '',
    t('adminOrders.whatsapp.collectionInstruction'),
  ]
    .filter((line): line is string => line !== null)
    .join('\n')
}

function buildDriverReminderWhatsAppMessage(order: ExamOrder, t: TranslateFn): string {
  return [
    t('adminOrders.whatsapp.reminderTitle', { orderId: order.id }),
    t('adminOrders.whatsapp.reminderOverdue'),
    t('adminOrders.whatsapp.patient', { patient: order.patient_name }),
    t('adminOrders.whatsapp.owner', { owner: order.owner_name }),
    t('adminOrders.whatsapp.reminderInstruction'),
  ].join('\n')
}

function buildDriverWhatsAppUrl(driverPhone: string, order: ExamOrder, t: TranslateFn): string {
  const digits = toDigitsOnly(driverPhone)
  const message = buildDriverWhatsAppMessage(order, t)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

function buildDriverReminderWhatsAppUrl(driverPhone: string, order: ExamOrder, t: TranslateFn): string {
  const digits = toDigitsOnly(driverPhone)
  const message = buildDriverReminderWhatsAppMessage(order, t)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export default function AdminOrdersSection({ driverPhone, orders, onDataChanged }: AdminOrdersSectionProps) {
  const { t } = useI18n()
  const [orderEdits, setOrderEdits] = useState<Record<number, OrderEdit>>({})
  const [driverPhoneInput, setDriverPhoneInput] = useState(formatInternationalPhone(driverPhone ?? ''))
  const [isDriverSettingsOpen, setIsDriverSettingsOpen] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({})
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

    toast.success(t('adminOrders.toast.orderUpdated'))
    await onDataChanged()
  }

  const saveDriverPhone = async () => {
    if (toDigitsOnly(driverPhoneInput).length !== 13) {
      toast.error(t('adminOrders.driver.validation.phoneLength'))
      return
    }

    setIsSavingDriverPhone(true)
    const { error } = await updateDriverPhoneSetting(driverPhoneInput.trim())
    setIsSavingDriverPhone(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(t('adminOrders.driver.toast.saved'))
    await onDataChanged()
  }

  const hasValidDriverPhone = toDigitsOnly(driverPhoneInput).length === 13
  const normalizedDriverPhone = useMemo(() => driverPhoneInput.trim(), [driverPhoneInput])
  const activeOrders = useMemo(() => orders.filter((order) => order.status !== 'completed'), [orders])

  const toggleOrderExpanded = (orderId: number) => {
    setExpandedOrders((previous) => ({
      ...previous,
      [orderId]: !(previous[orderId] ?? false),
    }))
  }

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

    toast.success(checked ? t('adminOrders.collection.toast.requestSaved') : t('adminOrders.collection.toast.requestCleared'))
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

    toast.success(t('adminOrders.collection.toast.sampleSaved'))
  }

  return (
    <section className="section">
      <h2>{t('adminOrders.title')}</h2>
      <div className="driver-settings-wrap">
        <button
          aria-expanded={isDriverSettingsOpen}
          className={isDriverSettingsOpen ? 'secondary driver-settings-toggle active' : 'secondary driver-settings-toggle'}
          type="button"
          onClick={() => setIsDriverSettingsOpen((current) => !current)}
        >
          <span className="driver-settings-toggle-copy">
            <span className="driver-settings-toggle-title">{t('adminOrders.driver.title')}</span>
            <span className="driver-settings-toggle-subtitle">
              {driverPhone
                ? t('adminOrders.driver.currentDriver', { phone: formatInternationalPhone(driverPhone) })
                : t('adminOrders.driver.notSaved')}
            </span>
          </span>
          <span aria-hidden="true" className="driver-settings-toggle-caret">
            {isDriverSettingsOpen ? '˄' : '˅'}
          </span>
        </button>

        {isDriverSettingsOpen ? (
          <section className="driver-settings-card driver-settings-panel">
            <h3>{t('adminOrders.driver.title')}</h3>
            <p className="muted small">{t('adminOrders.driver.copy')}</p>
            <div className="driver-settings-row">
              <label>
                {t('adminOrders.driver.phoneLabel')}
                <input
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="+55 (11) 99999-9999"
                  value={driverPhoneInput}
                  onChange={(event) => setDriverPhoneInput(formatInternationalPhone(event.target.value))}
                />
              </label>
              <button type="button" onClick={() => void saveDriverPhone()} disabled={isSavingDriverPhone}>
                {isSavingDriverPhone ? t('common.saving') : t('adminOrders.driver.saveButton')}
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {activeOrders.length === 0 ? <p>{t('adminOrders.empty')}</p> : null}

      <div className="order-list">
        {activeOrders.map((order) => {
          const edit = orderEdits[order.id]
          const isSavingCollection = collectionSavingByOrder[order.id] ?? false
          const isExpanded = expandedOrders[order.id] ?? false
          const neuterLabel = order.neuter_status ? t(`adminOrders.neuter.${order.neuter_status}`) : t('common.notProvided')
          const reactiveLabel = order.reactive_status
            ? t(`adminOrders.reactive.${order.reactive_status}`)
            : t('common.notProvided')
          const isDriverCollectionRequested = edit?.driver_collection_requested ?? order.driver_collection_requested
          const driverRequestedAt = edit?.driver_requested_at ?? order.driver_requested_at
          const sampleReceivedAt = edit?.sample_received_at ?? order.sample_received_at
          const collectionState = getCollectionTrackingState(
            order.request_collection,
            isDriverCollectionRequested,
            driverRequestedAt,
            sampleReceivedAt,
            nowMs,
            t,
          )
          const compactCollectionSummary = getCompactCollectionSummary(
            order.request_collection,
            isDriverCollectionRequested,
            sampleReceivedAt,
            collectionState.isOverdue,
            t,
          )

          return (
            <article className="order-card" key={order.id}>
              <button
                aria-expanded={isExpanded}
                className={isExpanded ? 'order-card-toggle active' : 'order-card-toggle'}
                type="button"
                onClick={() => toggleOrderExpanded(order.id)}
              >
                <span className="order-card-toggle-copy">
                  <span className="order-card-head">
                    <span className="order-card-title">{t('adminOrders.orderTitle', { orderId: order.id })}</span>
                    <StatusBadge status={order.status} />
                  </span>
                  <span className="order-card-summary">
                    {order.patient_name} | {order.owner_name} | {formatDateTime(order.created_at)}
                  </span>
                  <span className="order-card-meta">
                    <span className={`order-summary-chip ${compactCollectionSummary.toneClassName}`}>
                      {compactCollectionSummary.label}
                    </span>
                    <span className="order-summary-chip is-neutral">
                      {t('adminOrders.summary.examCount', { count: order.selected_exams.length })}
                    </span>
                    <span className="order-summary-chip is-neutral">{formatCurrency(order.total_value)}</span>
                  </span>
                </span>
                <span aria-hidden="true" className="order-card-caret">
                  {isExpanded ? '˄' : '˅'}
                </span>
              </button>

              {isExpanded ? (
                <>
                  <div className={collectionState.bannerClassName}>
                    <strong>{collectionState.bannerText}</strong>
                  </div>

                  <p className="small muted">
                    {t('adminOrders.details.created')}: {formatDateTime(order.created_at)} | {t('adminOrders.details.vet')}:{' '}
                    {order.vet_name_snapshot ?? t('adminHistory.fallback.unknownVet')} ({order.vet_email_snapshot ?? '-'})
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.crmv')}:</strong> {order.vet_crmv_snapshot ?? '-'}
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.clinic')}:</strong>{' '}
                    {order.vet_clinic_name ??
                      (order.vet_professional_type === 'independent'
                        ? t('adminOrders.fallback.independentProfessional')
                        : t('adminOrders.fallback.clinicNotInformed'))}
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.clinicAddress')}:</strong> {order.vet_clinic_address ?? '-'}
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.patient')}:</strong> {order.patient_name}
                    {order.species ? ` (${order.species})` : ''}
                    {order.breed ? `, ${order.breed}` : ''}
                    {order.age_years !== null ? `, ${order.age_years}${t('adminOrders.details.yearsSuffix')}` : ''}
                    {order.weight_kg !== null ? `, ${order.weight_kg}kg` : ''}
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.neutered')}:</strong> {neuterLabel} | <strong>{t('adminOrders.details.reactive')}:</strong>{' '}
                    {reactiveLabel}
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.owner')}:</strong> {order.owner_name} | <strong>{t('adminOrders.details.cpf')}:</strong>{' '}
                    {order.owner_ssn ?? '-'} | <strong>{t('adminOrders.details.phone')}:</strong> {order.owner_phone ?? '-'}
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.address')}:</strong> {order.owner_address ?? '-'}
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.requestCollection')}:</strong>{' '}
                    {order.request_collection ? t('common.yes') : t('common.no')}
                  </p>

                  {driverRequestedAt ? (
                    <p>
                      <strong>{t('adminOrders.details.driverRequestedAt')}:</strong> {formatDateTime(driverRequestedAt)}
                    </p>
                  ) : null}

                  {sampleReceivedAt ? (
                    <p>
                      <strong>{t('adminOrders.details.sampleReceivedAt')}:</strong> {formatDateTime(sampleReceivedAt)}
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
                          {isSavingCollection
                            ? t('adminOrders.collection.savingStatus')
                            : t('adminOrders.collection.requestedDriverToggle')}
                        </span>
                      </label>

                      <div className="row-actions">
                        {hasValidDriverPhone ? (
                          <a
                            className="button-link"
                            href={buildDriverWhatsAppUrl(normalizedDriverPhone, order, t)}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t('adminOrders.collection.openDriverWhatsapp')}
                          </a>
                        ) : (
                          <button className="secondary" disabled type="button">
                            {t('adminOrders.collection.saveDriverPhoneFirst')}
                          </button>
                        )}

                        {isDriverCollectionRequested && !sampleReceivedAt ? (
                          <button
                            className="secondary"
                            disabled={isSavingCollection}
                            type="button"
                            onClick={() => void handleMarkSampleReceived(order)}
                          >
                            {isSavingCollection ? t('common.saving') : t('adminOrders.collection.markSampleReceived')}
                          </button>
                        ) : null}

                        {collectionState.isOverdue && hasValidDriverPhone ? (
                          <a
                            className="button-link warning"
                            href={buildDriverReminderWhatsAppUrl(normalizedDriverPhone, order, t)}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {t('adminOrders.collection.openReminderWhatsapp')}
                          </a>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  <p>
                    <strong>{t('adminOrders.details.exams')}:</strong> {order.selected_exams.map((exam) => exam.exam_name).join(', ')}
                  </p>

                  <p>
                    <strong>{t('adminOrders.details.total')}:</strong> {formatCurrency(order.total_value)}
                  </p>

                  <div className="grid two">
                    <label>
                      {t('adminOrders.form.status')}
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
                        <option value="requested">{t('status.requested')}</option>
                        <option value="scheduled">{t('status.scheduled')}</option>
                        <option value="in_progress">{t('status.in_progress')}</option>
                        <option value="completed">{t('status.completed')}</option>
                        <option value="cancelled">{t('status.cancelled')}</option>
                      </select>
                    </label>

                    <label>
                      {t('adminOrders.form.adminNotes')}
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
                    {t('adminOrders.form.saveOrder')}
                  </button>
                </>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
