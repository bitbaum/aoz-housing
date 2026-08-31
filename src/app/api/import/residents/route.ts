import { NextResponse } from 'next/server'
import { authorizeStaff } from '@/lib/auth'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { prisma } from '@/lib/db'
import { ResidentImportSchema } from '@/lib/validation/import'
import Papa from 'papaparse'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'

// Reject CSV uploads larger than 5 MB — a sanity cap to prevent OOM on
// hostile uploads. ~25k typical-resident rows fit well under this.
const MAX_CSV_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const auth = await authorizeStaff('import:write')
  if (!auth.ok) {
    return NextResponse.json(
      {
        error:
          auth.status === 401 ? 'Nicht authentifiziert' : ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      },
      { status: auth.status },
    )
  }
  const user = auth.user

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
  }

  if (file.size > MAX_CSV_BYTES) {
    return NextResponse.json(
      { error: `Datei zu gross (max ${MAX_CSV_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
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
      { status: 400 },
    )
  }

  const results = {
    created: 0,
    skipped: 0,
    errors: [] as { row: number; error: string }[],
  }

  // Phase 1: validate all rows in JS so we can short-circuit bad input
  // before touching the database. Build the bulk insert payload from rows
  // that pass validation; track failures with the original CSV row number.
  type ValidRow = { row: number; data: ReturnType<typeof ResidentImportSchema.parse> }
  const validRows: ValidRow[] = []
  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i] as Record<string, string>
    const validation = ResidentImportSchema.safeParse(row)
    if (!validation.success) {
      results.errors.push({
        row: i + 2,
        error: validation.error.issues.map((e) => `${e.path}: ${e.message}`).join(', '),
      })
      results.skipped++
      continue
    }
    validRows.push({ row: i + 2, data: validation.data })
  }

  if (validRows.length === 0) {
    return NextResponse.json({ success: true, ...results })
  }

  // Phase 2: one createMany with skipDuplicates so a single P2002 conflict
  // doesn't abort the whole batch. Then a single audit insert per created
  // resident is collected in one transaction so a partial failure is undone.
  try {
    const createdRows = await prisma.$transaction(async (tx) => {
      // Detect which codes already exist BEFORE the bulk insert, so we can
      // report per-row "already exists" errors. `createMany` with
      // `skipDuplicates` silently drops them — we want to surface them.
      const existing = await tx.resident.findMany({
        where: { code: { in: validRows.map((v) => v.data.code) } },
        select: { code: true },
      })
      const existingCodes = new Set(existing.map((r) => r.code))

      const toInsert = validRows.filter((v) => !existingCodes.has(v.data.code))
      for (const v of validRows) {
        if (existingCodes.has(v.data.code)) {
          results.errors.push({
            row: v.row,
            error: `Code "${v.data.code}" existiert bereits`,
          })
          results.skipped++
        }
      }

      if (toInsert.length === 0) return []

      await tx.resident.createMany({
        data: toInsert.map((v) => ({
          ...v.data,
          privacyNeed: 3,
          guestTolerance: 3,
          status: 'ACTIVE',
        })),
        // Race-safety: if a concurrent import inserts one of these codes
        // between our pre-check and the createMany, skip rather than throw.
        skipDuplicates: true,
      })

      // We need the IDs for the audit log; createMany doesn't return them.
      const inserted = await tx.resident.findMany({
        where: { code: { in: toInsert.map((v) => v.data.code) } },
        select: { id: true, code: true },
      })

      await tx.auditLog.createMany({
        data: inserted.map((r) => ({
          action: 'CREATE',
          entity: 'RESIDENT',
          entityId: r.id,
          userId: user.id,
          changes: { code: r.code, source: 'CSV_IMPORT' },
        })),
      })

      return inserted
    })

    results.created = createdRows.length
  } catch (error) {
    logger.errorWithCause('CSV import transaction failed', error, { rows: validRows.length })
    // The whole batch rolled back — surface a single coarse error.
    results.errors.push({ row: 0, error: 'Import abgebrochen' })
    results.skipped = validRows.length
  }

  // Backfill audit-log call so existing log consumers don't break. The
  // createMany above already wrote AuditLog rows, but logAudit() also emits
  // an info-level log entry, which downstream observers may key on.
  if (results.created > 0) {
    await logAudit({
      action: 'CREATE',
      entity: 'RESIDENT',
      entityId: 'CSV_IMPORT_BATCH',
      userId: user.id,
      changes: { source: 'CSV_IMPORT', count: results.created },
    })
  }

  return NextResponse.json({ success: true, ...results })
}
