/**
 * Badge component for status indicators
 */

import { getStatusBadgeClass } from '@/lib/utils/formatting'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'active' | 'pending' | 'ended' | 'alert' | 'custom'
  className?: string
}

export function Badge({ children, variant = 'active', className = '' }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    active: 'badge-active',
    pending: 'badge-pending',
    ended: 'badge-ended',
    alert: 'badge-alert',
    custom: '',
  }

  return <span className={`badge ${variantClasses[variant]} ${className}`}>{children}</span>
}

interface StatusBadgeProps {
  status: string
  labels?: Record<string, string>
}

export function StatusBadge({ status, labels }: StatusBadgeProps) {
  const label = labels?.[status] || status
  return <span className={`badge ${getStatusBadgeClass(status)}`}>{label}</span>
}
