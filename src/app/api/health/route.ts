import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getAIHealth } from '@/lib/ai/health'

/**
 * Health check for uptime monitors. Confirms the app is reachable AND can
 * reach the database. Returns 200 only when fully healthy; 503 otherwise.
 *
 * `ai` is informational only — a dead AI provider must never fail the check
 * that feeds a kill-and-restart decision, since a restart can't fix someone
 * else's outage. It never affects the status code.
 *
 * No auth required (`/api/health` is allow-listed in middleware).
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const started = Date.now()
  const ai = getAIHealth()
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({
      status: 'ok',
      db: 'up',
      ai,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'down',
        ai,
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
