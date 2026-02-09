import { prisma } from '@/lib/db'
import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  SOCIAL_STYLE_LABELS,
  INCIDENT_TYPE_LABELS,
  PORTAL_LABELS,
  getLabel,
} from '@/lib/constants'
import { SatisfactionRating } from '@/components/portal/SatisfactionRating'
import { PortalLanding } from '@/components/portal/PortalLanding'
import { getScoreBgClass, getScoreLabel, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function ResidentPortal({ searchParams }: PageProps) {
  const params = await searchParams
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return <PortalLanding error={params.error} />
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
    // Clear the invalid cookie by redirecting with error
    return <PortalLanding error="account_not_found" />
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {PORTAL_LABELS.pages.dashboard}, {resident.code}
          </h1>
          <p className="text-gray-500 mt-1">
            {PORTAL_LABELS.pages.dashboardSubtitle}
          </p>
        </div>
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
              <h2 className="text-lg font-semibold text-gray-900">{PORTAL_LABELS.dashboard.housing}</h2>
              <p className="text-gray-500">{housingUnit?.address}</p>
            </div>
            <span className="badge badge-active">{PORTAL_LABELS.dashboard.active}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <InfoBox
              label={PORTAL_LABELS.dashboard.moveIn}
              value={formatDate(currentPlacement.startDate)}
            />
            <InfoBox
              label={PORTAL_LABELS.dashboard.rooms}
              value={`${housingUnit?.totalRooms || 0}`}
            />
            <InfoBox
              label={PORTAL_LABELS.dashboard.roommates}
              value={`${roommates.length}`}
            />
            <InfoBox
              label={PORTAL_LABELS.dashboard.compatibility}
              value={currentPlacement.compatibilityScore
                ? `${Math.round(currentPlacement.compatibilityScore)}%`
                : '--'}
            />
          </div>

          {/* House Rules Summary */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-medium text-gray-900 mb-2">{PORTAL_LABELS.dashboard.houseRules}</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              {housingUnit?.quietHours && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {PORTAL_LABELS.dashboard.quietHours}: {housingUnit.quietHours}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full ${
                housingUnit?.smokingAllowed
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {housingUnit?.smokingAllowed ? PORTAL_LABELS.dashboard.smokingAllowed : PORTAL_LABELS.dashboard.noSmoking}
              </span>
              <span className={`px-3 py-1 rounded-full ${
                housingUnit?.petsAllowed
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-600'
              }`}>
                {housingUnit?.petsAllowed ? PORTAL_LABELS.dashboard.petsAllowed : PORTAL_LABELS.dashboard.noPets}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card mb-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {PORTAL_LABELS.dashboard.onboarding.title}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {PORTAL_LABELS.dashboard.onboarding.subtitle}
          </p>

          {/* Progress timeline */}
          <div className="space-y-4 mb-6">
            {PORTAL_LABELS.dashboard.onboarding.steps.map((step, i) => (
              <div key={step.label} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done
                      ? 'bg-green-100 text-green-600'
                      : i === 1
                        ? 'bg-aoz-primary/10 text-aoz-primary ring-2 ring-aoz-primary'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{i + 1}</span>
                    )}
                  </div>
                  {i < PORTAL_LABELS.dashboard.onboarding.steps.length - 1 && (
                    <div className={`w-0.5 h-6 mt-1 ${step.done ? 'bg-green-200' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-medium ${
                    step.done ? 'text-green-700' : i === 1 ? 'text-aoz-primary' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-aoz-primary/5 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-3">
              {PORTAL_LABELS.dashboard.onboarding.completePreferencesHint}
            </p>
            <Link
              href="/portal/preferences"
              className="btn-primary inline-flex items-center min-h-[44px] px-6"
            >
              {PORTAL_LABELS.dashboard.onboarding.completePreferences} →
            </Link>
          </div>

          {/* Contact info */}
          <p className="text-sm text-gray-500 mt-4">
            {PORTAL_LABELS.dashboard.noHousingContact}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickActionCard
          href="/portal/report"
          icon={PORTAL_LABELS.dashboard.quickActions.report.icon}
          title={PORTAL_LABELS.dashboard.quickActions.report.title}
          description={PORTAL_LABELS.dashboard.quickActions.report.desc}
        />
        <QuickActionCard
          href="/portal/roommates"
          icon={PORTAL_LABELS.dashboard.quickActions.roommates.icon}
          title={PORTAL_LABELS.dashboard.quickActions.roommates.title}
          description={PORTAL_LABELS.dashboard.quickActions.roommates.desc}
        />
        <QuickActionCard
          href="/portal/preferences"
          icon={PORTAL_LABELS.dashboard.quickActions.preferences.icon}
          title={PORTAL_LABELS.dashboard.quickActions.preferences.title}
          description={PORTAL_LABELS.dashboard.quickActions.preferences.desc}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roommates Preview */}
        {roommates.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{PORTAL_LABELS.dashboard.roommates}</h2>
              <Link href="/portal/roommates" className="text-sm text-aoz-primary hover:underline">
                {PORTAL_LABELS.dashboard.showAll}
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
            <h2 className="text-lg font-semibold text-gray-900">{PORTAL_LABELS.dashboard.myReports}</h2>
            <Link href="/portal/report" className="text-sm text-aoz-primary hover:underline">
              {PORTAL_LABELS.dashboard.newReport}
            </Link>
          </div>

          {resident.incidentsReported.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              {PORTAL_LABELS.dashboard.noReports}
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
                      {incident.resolvedAt ? PORTAL_LABELS.dashboard.resolved : PORTAL_LABELS.dashboard.open}
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
              {PORTAL_LABELS.dashboard.openMaintenance}
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
                      {PORTAL_LABELS.dashboard.reported}: {formatDate(incident.date)}
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
