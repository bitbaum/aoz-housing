import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

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
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const csv = IMPORT_HEADERS.join(',') + '\n'
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="import-vorlage.csv"',
    },
  })
}
