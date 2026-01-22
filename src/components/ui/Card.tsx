/**
 * Card components
 */

import Link from 'next/link'

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
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral' | 'good' | 'warning'
  href?: string
}

export function StatCard({ title, value, subtitle, trend = 'neutral', href }: StatCardProps) {
  const trendColors: Record<string, string> = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
    good: 'text-green-600',
    warning: 'text-orange-600',
  }

  const content = (
    <>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && (
        <p className={`text-sm mt-2 ${trendColors[trend]}`}>{subtitle}</p>
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
