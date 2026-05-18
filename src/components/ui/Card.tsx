/**
 * Card components
 */

import Link from 'next/link'
import { getTrendColorClass, type TrendType } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  )
}

interface CardLinkProps extends CardProps {
  href: string
}

export function CardLink({ children, href, className = '' }: CardLinkProps) {
  return (
    <Link href={href} className={`card-hover ${className}`}>
      {children}
    </Link>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: TrendType
  href?: string
}

export function StatCard({ label, value, subtitle, trend = 'neutral', href }: StatCardProps) {
  // Apply trend color to value if no subtitle, otherwise to subtitle
  const valueColor = !subtitle && trend !== 'neutral' ? getTrendColorClass(trend) : 'text-ui-text'

  const content = (
    <>
      <p className="text-sm text-ui-muted">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
      {subtitle && (
        <p className={`text-sm mt-2 ${getTrendColorClass(trend)}`}>{subtitle}</p>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className="card-hover">
        {content}
      </Link>
    )
  }

  return <div className="card">{content}</div>
}

// =============================================================================
// DetailRow - For key-value display in detail pages
// =============================================================================

interface DetailRowProps {
  label: string
  value: string | React.ReactNode
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between">
      <dt className="text-ui-muted">{label}</dt>
      <dd className="text-ui-text font-medium">{value}</dd>
    </div>
  )
}
