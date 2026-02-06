import { prisma } from '@/lib/db'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  SOCIAL_STYLE_LABELS,
  INCIDENT_TYPE_LABELS,
  getLabel,
} from '@/lib/constants'
import { SatisfactionRating } from '@/components/portal/SatisfactionRating'
import { getScoreBgClass, getScoreLabel, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ResidentPortal() {
  // Get resident from session/auth (cookie-based for now)
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return <LoginPrompt />
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
              incidents: {
                where: {
                  category: 'MAINTENANCE',
                  resolvedAt: null,
                },
                orderBy: { date: 'desc' },
                take: 5,
              },
            },
          },
          checkIns: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      incidentsReported: {
        orderBy: { date: 'desc' },
        take: 5,
      },
      incidentsAsSubject: {
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  })

  if (!resident) {
    return <LoginPrompt error="Code nicht gefunden" />
  }

  const currentPlacement = resident.placements[0]
  const housingUnit = currentPlacement?.housingUnit
  const roommates = housingUnit?.placements
    .filter(p => p.residentId !== resident.id)
    .map(p => p.resident) || []
  const lastCheckIn = currentPlacement?.checkIns?.[0]

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
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Willkommen, {resident.code}
        </h1>
        <p className="text-gray-500 mt-1">
          Hier findest du alles zu deiner Unterkunft
        </p>
      </div>

      {/* Satisfaction Check-In - Prominent Position */}
      {currentPlacement && (
        <div className="mb-8">
          <SatisfactionRating
            currentRating={currentPlacement.satisfactionRating}
            lastCheckInDate={lastCheckIn?.createdAt}
          />
        </div>
      )}

      {/* Current Housing */}
      {currentPlacement ? (
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Deine Unterkunft</h2>
              <p className="text-gray-500">{housingUnit?.address}</p>
            </div>
            <span className="badge badge-active">Aktiv</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <InfoBox
              label="Einzug"
              value={formatDate(currentPlacement.startDate)}
            />
            <InfoBox
              label="Zimmer"
              value={`${housingUnit?.totalRooms || 0}`}
            />
            <InfoBox
              label="Mitbewohner"
              value={`${roommates.length}`}
            />
            <InfoBox
              label="Kompatibilität"
              value={currentPlacement.compatibilityScore
                ? `${Math.round(currentPlacement.compatibilityScore)}%`
                : '--'}
            />
          </div>

          {/* House Rules Summary */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-medium text-gray-900 mb-2">Hausregeln</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              {housingUnit?.quietHours && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  Ruhezeit: {housingUnit.quietHours}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full ${
                housingUnit?.smokingAllowed
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {housingUnit?.smokingAllowed ? 'Rauchen erlaubt' : 'Nichtraucher'}
              </span>
              <span className={`px-3 py-1 rounded-full ${
                housingUnit?.petsAllowed
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-600'
              }`}>
                {housingUnit?.petsAllowed ? 'Haustiere erlaubt' : 'Keine Haustiere'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card mb-6 text-center py-8">
          <p className="text-gray-500 mb-4">
            Du hast noch keine Unterkunft zugewiesen bekommen
          </p>
          <p className="text-sm text-gray-400">
            Bitte kontaktiere deinen Betreuer
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickActionCard
          href="/portal/report"
          icon="🔧"
          title="Problem melden"
          description="Defekte oder Wartung melden"
        />
        <QuickActionCard
          href="/portal/roommates"
          icon="👥"
          title="Mitbewohner"
          description="Infos zu deinen Mitbewohnern"
        />
        <QuickActionCard
          href="/portal/preferences"
          icon="⚙️"
          title="Einstellungen"
          description="Deine Präferenzen anpassen"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roommates Preview */}
        {roommates.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mitbewohner</h2>
              <Link href="/portal/roommates" className="text-sm text-aoz-primary hover:underline">
                Alle anzeigen
              </Link>
            </div>
            <div className="space-y-3">
              {roommates.slice(0, 3).map((roommate) => {
                const score = compatibilityScores.find(
                  s => s.residentId === roommate.id || s.comparedWithId === roommate.id
                )?.overallScore
                return (
                  <div
                    key={roommate.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-aoz-secondary text-white rounded-full flex items-center justify-center font-medium">
                        {roommate.code.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{roommate.code}</p>
                        <p className="text-sm text-gray-500">
                          {getLabel(SOCIAL_STYLE_LABELS, roommate.socialStyle)}
                        </p>
                      </div>
                    </div>
                    {score && (
                      <CompatibilityBadge score={score} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Deine Meldungen</h2>
            <Link href="/portal/report" className="text-sm text-aoz-primary hover:underline">
              Neu melden
            </Link>
          </div>

          {resident.incidentsReported.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              Keine Meldungen
            </p>
          ) : (
            <div className="space-y-3">
              {resident.incidentsReported.map((incident) => (
                <div
                  key={incident.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {incident.description.slice(0, 50)}
                        {incident.description.length > 50 && '...'}
                      </p>
                    </div>
                    <span className={`badge ${incident.resolvedAt ? 'badge-active' : 'badge-pending'}`}>
                      {incident.resolvedAt ? 'Erledigt' : 'Offen'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Maintenance in Building */}
        {housingUnit && housingUnit.incidents.length > 0 && (
          <div className="card md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Offene Wartung im Gebäude
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {housingUnit.incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg"
                >
                  <span className="text-xl">🔧</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Gemeldet: {formatDate(incident.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Components

function LoginPrompt({ error }: { error?: string }) {
  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mein Zuhause</h1>
        <p className="text-gray-500 mb-6">
          Gib deinen Bewohnercode ein, um fortzufahren
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form action="/api/portal/login" method="POST">
          <input
            type="text"
            name="code"
            placeholder="Dein Code (z.B. RES-001)"
            className="input mb-4"
            required
            autoFocus
          />
          <button type="submit" className="btn-primary w-full">
            Einloggen
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4">
          Deinen Code findest du auf deinem Willkommensbrief
        </p>
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="card-hover text-center"
    >
      <span className="text-4xl mb-3 block">{icon}</span>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  )
}

function CompatibilityBadge({ score }: { score: number }) {
  return (
    <span className={`badge ${getScoreBgClass(score)}`}>
      {getScoreLabel(score)}
    </span>
  )
}

