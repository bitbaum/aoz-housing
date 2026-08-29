import { NextResponse } from 'next/server'
import { authorizeStaff } from '@/lib/auth'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

const IMPORT_HEADERS = [
  'code',
  'ageRange',
  'gender',
  'familyStatus',
  'sleepSchedule',
  'noiseTolerance',
  'cleanlinessPractice',
  'socialStyle',
  'smokingStatus',
  'mobilityNeeds',
  'languages',
]

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

  const csv = IMPORT_HEADERS.join(',') + '\n'
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="import-vorlage.csv"',
    },
  })
}
