import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCSV } from '@/lib/export'
import { EXPORT_COLUMNS } from '@/lib/export/config'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  try {
    const data = await prisma.resident.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const csv = generateCSV(
      data as unknown as Record<string, unknown>[],
      EXPORT_COLUMNS.residents
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bewohner-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export fehlgeschlagen' }, { status: 500 })
  }
}
