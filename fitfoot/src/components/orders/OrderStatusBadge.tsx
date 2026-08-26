import { ORDER_STATUS_BADGE_CLASS, ORDER_STATUS_LABELS } from '@/config/labels'
import { isOrderStatus } from '@/lib/orders/status'

export function OrderStatusBadge({ status }: { status: string }) {
  if (!isOrderStatus(status)) {
    return <span className="badge-neutral">{status}</span>
  }
  return <span className={ORDER_STATUS_BADGE_CLASS[status]}>{ORDER_STATUS_LABELS[status]}</span>
}
