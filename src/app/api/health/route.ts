import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Health check for uptime monitors. Confirms the app is reachable AND can
 * reach the database. Returns 200 only when fully healthy; 503 otherwise.
 *
 * No auth required (`/api/health` is allow-listed in middleware).
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const started = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'up',
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        db: 'down',
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
