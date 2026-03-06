import type { OrderStatus } from '../types/app'
import { useI18n } from '../i18n'

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n()
  return <span className={`status status-${status}`}>{t(`status.${status}`)}</span>
}
