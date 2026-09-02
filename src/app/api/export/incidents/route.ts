import { NextResponse } from 'next/server'
import { authorizeStaff } from '@/lib/auth'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { db, incident } from '@/lib/db'
import { desc } from 'drizzle-orm'
import { generateCSV } from '@/lib/export'
import { EXPORT_COLUMNS } from '@/lib/export/config'

export async function GET() {
  const auth = await authorizeStaff('export:read')
  if (!auth.ok) {
    return NextResponse.json(
      {
        error:
          auth.status === 401 ? 'Nicht authentifiziert' : ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      },
      { status: auth.status },
    )
  }

  try {
    const data = await db.query.incident.findMany({
      orderBy: [desc(incident.date)],
    })

    const csv = generateCSV(data as unknown as Record<string, unknown>[], EXPORT_COLUMNS.incidents)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vorfaelle-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export fehlgeschlagen' }, { status: 500 })
  }
}
