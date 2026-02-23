import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ResidentImportSchema } from '@/lib/validation/import'
import Papa from 'papaparse'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json(
      { error: 'Keine Datei hochgeladen' },
      { status: 400 }
    )
  }

  const text = await file.text()
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'CSV-Parsing fehlgeschlagen',
        details: parsed.errors.slice(0, 5),
      },
      { status: 400 }
    )
  }

  const results = {
    created: 0,
    skipped: 0,
    errors: [] as { row: number; error: string }[],
  }

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i] as Record<string, string>
    const validation = ResidentImportSchema.safeParse(row)

    if (!validation.success) {
      results.errors.push({
        row: i + 2, // +2 for header row + 0-index
        error: validation.error.issues
          .map((e) => `${e.path}: ${e.message}`)
          .join(', '),
      })
      results.skipped++
      continue
    }

    // Check for duplicate code
    const existing = await prisma.resident.findUnique({
      where: { code: validation.data.code },
      select: { id: true },
    })

    if (existing) {
      results.errors.push({
        row: i + 2,
        error: `Code "${validation.data.code}" existiert bereits`,
      })
      results.skipped++
      continue
    }

    try {
      const resident = await prisma.resident.create({
        data: {
          ...validation.data,
          privacyNeed: 3,
          guestTolerance: 3,
          status: 'ACTIVE',
        },
      })

      await logAudit({
        action: 'CREATE',
        entity: 'RESIDENT',
        entityId: resident.id,
        userId: user.id,
        changes: { code: validation.data.code, source: 'CSV_IMPORT' },
      })

      results.created++
    } catch (error) {
      logger.errorWithCause('Failed to import resident row', error, {
        row: i + 2,
      })
      results.errors.push({ row: i + 2, error: 'Erstellung fehlgeschlagen' })
      results.skipped++
    }
  }

  return NextResponse.json({ success: true, ...results })
}
