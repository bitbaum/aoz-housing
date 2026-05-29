/**
 * Daily cron endpoint for email notifications.
 * Authenticated via Bearer token (CRON_SECRET).
 *
 * Checks for:
 * 1. Overdue incident follow-ups (MEDIUM/HIGH/CRITICAL, past nextFollowUpDate)
 * 2. Overdue resident check-ins (based on support level thresholds)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { notifyStaff, incidentFollowUpReminder, checkInReminder } from '@/lib/email'
import { logger } from '@/lib/logger'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { getCheckInInterval } from '@/lib/config/checkin-intervals'
import { daysBetween } from '@/lib/utils'

// Vercel function timeout for this cron run. Default is 10s; raise so the
// batched query + email send don't get killed mid-flight at scale.
export const maxDuration = 60

export async function GET(request: Request) {
  // Auth: verify Bearer token matches CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { incidents: 0, checkIns: 0, errors: [] as string[] }

  try {
    // 1. Overdue incident follow-ups
    const overdueIncidents = await prisma.incident.findMany({
      where: {
        resolvedAt: null,
        nextFollowUpDate: { lt: new Date() },
        severity: { in: ['MEDIUM', 'HIGH', 'CRITICAL'] },
      },
      include: {
        housingUnit: { select: { code: true } },
      },
      take: 50,
    })

    if (overdueIncidents.length > 0) {
      const template = incidentFollowUpReminder(
        overdueIncidents.map(i => ({
          id: i.id,
          description: i.description.slice(0, DISPLAY_LIMITS.emailSummary),
          severity: i.severity,
          housingUnitCode: i.housingUnit.code,
          nextFollowUpDate: i.nextFollowUpDate!,
        }))
      )
      const sent = await notifyStaff(template.subject, template.html)
      if (sent) results.incidents = overdueIncidents.length
    }

    // 2. Overdue resident check-ins.
    // Cap to a sane batch so a runaway dataset can't blow the function
    // timeout. The cron runs daily so we'd catch any backlog the next day.
    const activePlacements = await prisma.placement.findMany({
      where: { status: 'ACTIVE' },
      include: {
        resident: { select: { code: true, supportLevel: true } },
        checkIns: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      take: 1000,
    })

    const overdueResidents = activePlacements
      .map(p => {
        const lastCheckIn = p.checkIns[0]?.createdAt || p.startDate
        const daysSince = daysBetween(lastCheckIn)
        const threshold = getCheckInInterval(p.resident.supportLevel)
        return {
          code: p.resident.code,
          supportLevel: p.resident.supportLevel,
          lastCheckInDate: lastCheckIn,
          daysSinceLastCheckIn: daysSince,
          isOverdue: daysSince > threshold,
        }
      })
      .filter(r => r.isOverdue)

    if (overdueResidents.length > 0) {
      const template = checkInReminder(overdueResidents)
      const sent = await notifyStaff(template.subject, template.html)
      if (sent) results.checkIns = overdueResidents.length
    }
  } catch (error) {
    logger.errorWithCause('Cron notification error', error)
    results.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...results,
  })
}
