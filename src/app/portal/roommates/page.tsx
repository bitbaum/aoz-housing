import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getScoreLevel, type ScoreLevel } from '@/lib/config/thresholds'

export const dynamic = 'force-dynamic'

export default async function RoommatesPage() {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/portal')
  }

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: {
          housingUnit: {
            include: {
              placements: {
                where: { status: 'ACTIVE' },
                include: { resident: true },
              },
            },
          },
        },
      },
    },
  })

  if (!resident) {
    redirect('/portal')
  }

  const currentPlacement = resident.placements[0]
  const housingUnit = currentPlacement?.housingUnit
  const roommates = housingUnit?.placements
    .filter(p => p.residentId !== resident.id)
    .map(p => p.resident) || []

  // Get compatibility scores with roommates
  const compatibilityScores = roommates.length > 0
    ? await prisma.compatibilityAssessment.findMany({
        where: {
          OR: [
            { residentId: resident.id, comparedWithId: { in: roommates.map(r => r.id) } },
            { residentId: { in: roommates.map(r => r.id) }, comparedWithId: resident.id },
          ],
        },
      })
    : []

  return (
    <div>
      <div className="mb-6">
        <Link href="/portal" className="text-aoz-primary hover:underline text-sm">
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Deine Mitbewohner</h1>
        <p className="text-gray-500">
          {roommates.length === 0
            ? 'Du hast derzeit keine Mitbewohner'
            : `Du wohnst mit ${roommates.length} ${roommates.length === 1 ? 'Person' : 'Personen'} zusammen`
          }
        </p>
      </div>

      {roommates.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">🏠</span>
          <p className="text-gray-500">Du hast die Unterkunft für dich allein</p>
        </div>
      ) : (
        <div className="space-y-4">
          {roommates.map((roommate) => {
            const assessment = compatibilityScores.find(
              s => s.residentId === roommate.id || s.comparedWithId === roommate.id
            )
            return (
              <RoommateCard
                key={roommate.id}
                roommate={roommate}
                assessment={assessment}
              />
            )
          })}
        </div>
      )}

      {/* Tips for Living Together */}
      <div className="card mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tipps für das Zusammenleben
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TipCard
            icon="🗣️"
            title="Kommunikation"
            description="Sprich Probleme frühzeitig an, bevor sie grösser werden"
          />
          <TipCard
            icon="🤝"
            title="Respekt"
            description="Respektiere die Privatsphäre und Ruhezeiten deiner Mitbewohner"
          />
          <TipCard
            icon="🧹"
            title="Sauberkeit"
            description="Halte gemeinsame Räume sauber und räume nach dir auf"
          />
          <TipCard
            icon="📅"
            title="Absprachen"
            description="Trefft klare Vereinbarungen über Küche, Bad und Gemeinschaftsräume"
          />
        </div>
      </div>

      {/* Conflict Resolution */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Bei Konflikten
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>1. Direktes Gespräch:</strong> Versuche zuerst, das Problem direkt mit deinem Mitbewohner zu besprechen.
          </p>
          <p>
            <strong>2. Vermittlung:</strong> Wenn das nicht klappt, kann die Hausverwaltung vermitteln.
          </p>
          <p>
            <strong>3. Melden:</strong> Bei ernsthaften Problemen kannst du einen{' '}
            <Link href="/portal/report" className="text-aoz-primary hover:underline">
              Vorfall melden
            </Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

function RoommateCard({
  roommate,
  assessment,
}: {
  roommate: any
  assessment?: any
}) {
  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-aoz-secondary text-white rounded-full flex items-center justify-center text-xl font-bold">
          {roommate.code.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{roommate.code}</h3>
              <p className="text-sm text-gray-500">
                {getAgeRangeLabel(roommate.ageRange)}
              </p>
            </div>
            {assessment && (
              <CompatibilityIndicator score={assessment.overallScore} />
            )}
          </div>

          {/* Lifestyle Preview */}
          <div className="mt-4 flex flex-wrap gap-2">
            <LifestyleTag
              icon="🌙"
              label={getSleepScheduleLabel(roommate.sleepSchedule)}
            />
            <LifestyleTag
              icon="👤"
              label={getSocialStyleLabel(roommate.socialStyle)}
            />
            {roommate.smokingStatus !== 'NON_SMOKER' && (
              <LifestyleTag icon="🚬" label="Raucher" />
            )}
            {roommate.languages.length > 0 && (
              <LifestyleTag
                icon="💬"
                label={roommate.languages.slice(0, 2).join(', ')}
              />
            )}
          </div>

          {/* Compatibility Insights */}
          {assessment && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Stärken</p>
                  {assessment.strengths.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {assessment.strengths.slice(0, 2).map((s: string, i: number) => (
                        <li key={i} className="text-green-700">✓ {s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 mt-1">-</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500">Achtung</p>
                  {assessment.concerns.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {assessment.concerns.slice(0, 2).map((c: string, i: number) => (
                        <li key={i} className="text-orange-700">! {c}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 mt-1">-</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Config for compatibility indicator styling (uses thresholds from SSOT)
const COMPATIBILITY_INDICATOR_CONFIG: Record<ScoreLevel, { label: string; color: string; textColor: string }> = {
  excellent: { label: 'Sehr gut', color: 'bg-green-500', textColor: 'text-green-700' },
  good: { label: 'Gut', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  moderate: { label: 'OK', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
  low: { label: 'Herausfordernd', color: 'bg-orange-500', textColor: 'text-orange-700' },
  critical: { label: 'Schwierig', color: 'bg-red-500', textColor: 'text-red-700' },
}

function CompatibilityIndicator({ score }: { score: number }) {
  const level = getScoreLevel(score)
  const config = COMPATIBILITY_INDICATOR_CONFIG[level]

  return (
    <div className="text-right">
      <div className="flex items-center gap-2 justify-end">
        <div className={`w-3 h-3 rounded-full ${config.color}`} />
        <span className={`font-medium ${config.textColor}`}>{config.label}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{score}% kompatibel</p>
    </div>
  )
}

function LifestyleTag({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
      {icon} {label}
    </span>
  )
}

function TipCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}

// Labels
function getAgeRangeLabel(range: string): string {
  const labels: Record<string, string> = {
    YOUNG_ADULT: '18-25 Jahre',
    ADULT: '26-40 Jahre',
    MIDDLE_AGED: '41-55 Jahre',
    SENIOR: '56+ Jahre',
  }
  return labels[range] || range
}

function getSleepScheduleLabel(schedule: string): string {
  const labels: Record<string, string> = {
    EARLY_BIRD: 'Frühaufsteher',
    STANDARD: 'Normal',
    NIGHT_OWL: 'Nachteule',
    IRREGULAR: 'Unregelmässig',
  }
  return labels[schedule] || schedule
}

function getSocialStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    INTROVERTED: 'Ruhig',
    MODERATE: 'Ausgeglichen',
    EXTROVERTED: 'Gesellig',
  }
  return labels[style] || style
}
