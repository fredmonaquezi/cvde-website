import type { OrderStatus } from '../types/app'

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status status-${status}`}>{status.replace('_', ' ')}</span>
}
