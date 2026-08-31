/**
 * Daily demo reset endpoint.
 * Authenticated via Bearer token (CRON_SECRET), same contract as
 * cron/notifications. Triggered by a systemd timer on the box.
 *
 * Scope comes from DEMO_RESET_SCOPE (lib/demo/config):
 * - UNIT (default): tear down and reseed ONLY the demo apartment — safe on
 *   instances that also hold real data.
 * - FULL: truncate-everything + presentation narrative, for dedicated demo
 *   deployments only. Explicit opt-in.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { isDemoEnabled, getDemoResetScope } from '@/lib/demo/config'
import { resetDemoData } from '@/lib/demo/reset'
import { resetDemoWorld } from '@/lib/demo/scoped-reset'

// Truncate + full reseed comfortably exceeds the 10s default at cold start.
export const maxDuration = 120

/**
 * Stable integer for pg_advisory_lock; distinct from cron/notifications
 * (7283419021) so the two crons never block each other.
 */
const CRON_LOCK_KEY = 7283419022

export async function POST(request: Request) {
  // Auth: verify Bearer token matches CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // A reset on a non-demo deployment would destroy real data — refuse unless
  // the operator has explicitly opted this instance into demo mode.
  if (!isDemoEnabled()) {
    return NextResponse.json({ skipped: true, reason: 'demo-disabled' })
  }

  // Advisory lock: a reset overlapping itself (or a slow previous run) would
  // truncate mid-seed. Non-blocking — the later run just skips.
  const lockResult = await prisma.$queryRaw<Array<{ ok: boolean }>>`
    SELECT pg_try_advisory_lock(${CRON_LOCK_KEY}) AS ok
  `
  if (!lockResult[0]?.ok) {
    logger.warn('cron/reset-demo skipped: another run already in progress')
    return NextResponse.json({ skipped: true, reason: 'lock-held' })
  }

  try {
    const scope = getDemoResetScope()
    const summary = scope === 'FULL' ? await resetDemoData(prisma) : await resetDemoWorld(prisma)
    logger.info('Demo data reset', { scope, ...summary })
    return NextResponse.json({ success: true, scope, ...summary })
  } catch (error) {
    logger.errorWithCause('Demo reset failed', error)
    return NextResponse.json({ success: false, error: 'Demo reset failed' }, { status: 500 })
  } finally {
    // Release the advisory lock. Failure here is logged but never thrown,
    // so it cannot mask the reset's own outcome.
    try {
      await prisma.$queryRaw`SELECT pg_advisory_unlock(${CRON_LOCK_KEY})`
    } catch (unlockErr) {
      logger.errorWithCause('Failed to release cron advisory lock', unlockErr)
    }
  }
}
