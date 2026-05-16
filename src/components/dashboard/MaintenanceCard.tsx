'use client'

import Link from 'next/link'
import { MAINTENANCE_CARD_LABELS } from '@/lib/constants/labels'

interface MaintenanceCardProps {
  openTickets: number
  urgentTickets: number
  oldestTicketDays?: number
}

export function MaintenanceCard({
  openTickets,
  urgentTickets,
  oldestTicketDays,
}: MaintenanceCardProps) {
  const hasOpenTickets = openTickets > 0
  const hasUrgent = urgentTickets > 0

  const getTicketColor = (count: number): string => {
    if (count === 0) return 'text-status-success'
    if (count <= 3) return 'text-status-warning'
    if (count <= 7) return 'text-status-warning'
    return 'text-status-error'
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Wartung & Service</h2>

      {hasOpenTickets ? (
        <>
          {/* Main stat */}
          <Link href="/maintenance" className="block mb-4 group">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getTicketColor(openTickets)}`}>
                {openTickets}
              </span>
              <span className="text-gray-500 text-sm">offen</span>
            </div>
            {oldestTicketDays !== undefined && (
              <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-700">
                Ältestes Ticket: {oldestTicketDays} Tage
              </p>
            )}
          </Link>

          {/* Urgent indicator */}
          {hasUrgent && (
            <Link
              href="/maintenance?priority=URGENT"
              className="flex items-center justify-between py-2 px-3 bg-status-error/8 border border-status-error/25 rounded-lg hover:bg-status-error/12 transition-colors mb-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-status-error">🔥</span>
                <span className="text-red-800 text-sm font-medium">
                  {urgentTickets} dringend
                </span>
              </div>
              <span className="text-status-error">→</span>
            </Link>
          )}
        </>
      ) : (
        <div className="py-6 text-center">
          <span className="text-status-success text-2xl block mb-2">✓</span>
          <p className="text-green-700 text-sm font-medium">Alles erledigt</p>
        </div>
      )}

      {/* Quick action */}
      <Link
        href="/maintenance/new"
        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors"
      >
        <span>+</span>
        <span>{MAINTENANCE_CARD_LABELS.newTicket}</span>
      </Link>

      {hasOpenTickets && (
        <Link
          href="/maintenance"
          className="flex items-center justify-center min-h-[44px] mt-4 pt-4 border-t border-gray-100 text-sm text-aoz-primary hover:underline"
        >
          Alle Tickets →
        </Link>
      )}
    </div>
  )
}
