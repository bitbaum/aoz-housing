import { NextRequest, NextResponse } from 'next/server'
import { loginByCode, setSessionCookie } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { setResidentCookie } from '@/lib/portal-auth'

type DemoRole = 'staff' | 'resident'

function getDemoCode(role: DemoRole) {
  if (process.env.DEMO_ACCESS_ENABLED !== 'true') return null
  return role === 'staff'
    ? process.env.DEMO_STAFF_CODE
    : process.env.DEMO_RESIDENT_CODE
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const role = body?.role

    if (role !== 'staff' && role !== 'resident') {
      return NextResponse.json(
        { success: false, error: 'Demo-Rolle ungültig' },
        { status: 400 }
      )
    }

    const code = getDemoCode(role)
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Demo-Zugang ist nicht konfiguriert' },
        { status: 404 }
      )
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'demo'
    const result = await loginByCode(code.trim().toUpperCase(), clientIp)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    if (result.type === 'staff') {
      await setSessionCookie(result.user)
      return NextResponse.json({ success: true, type: 'staff' })
    }

    await setResidentCookie(result.code)

    return NextResponse.json({ success: true, type: 'resident' })
  } catch (error) {
    logger.errorWithCause('Demo login failed', error)
    return NextResponse.json(
      { success: false, error: 'Demo-Zugang fehlgeschlagen' },
      { status: 500 }
    )
  }
}
