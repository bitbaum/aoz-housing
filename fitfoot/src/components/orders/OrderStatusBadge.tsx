const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'Paid', className: 'bg-blue-100 text-blue-700' },
  SHIPPED: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-700' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-500' },
  REFUNDED: { label: 'Refunded', className: 'bg-red-100 text-red-700' },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-600' }
  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  )
}
