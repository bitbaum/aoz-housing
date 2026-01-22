import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS,
  FAMILY_STATUS_LABELS,
  SLEEP_SCHEDULE_LABELS,
  SOCIAL_STYLE_LABELS,
  SMOKING_STATUS_LABELS,
  MOBILITY_NEED_LABELS,
  RESIDENT_STATUS_LABELS,
  LANGUAGE_LABELS,
  DIET_LABELS,
  INCIDENT_TYPE_LABELS,
  END_REASON_LABELS,
  getLabel,
} from '@/lib/constants'
import {
  getStatusBadgeClass,
  getScoreLabel,
  getScoreColorClass,
  getScoreBgClass,
  getSeverityBorderClass,
  formatRelativeDate,
  formatDate,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResidentDetailPage({ params }: Props) {
  const { id } = await params

  const resident = await prisma.resident.findUnique({
    where: { id },
    include: {
      placements: {
        include: {
          housingUnit: true,
        },
        orderBy: { startDate: 'desc' },
      },
      incidents: {
        include: {
          housingUnit: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      },
      assessments: {
        include: {
          comparedWith: true,
        },
        orderBy: { overallScore: 'desc' },
        take: 5,
      },
    },
  })

  if (!resident) {
    notFound()
  }

  const currentPlacement = resident.placements.find((p) => p.status === 'ACTIVE')
  const pastPlacements = resident.placements.filter((p) => p.status !== 'ACTIVE')

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/residents"
              className="text-gray-500 hover:text-gray-700"
            >
              Bewohner
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{resident.code}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-12 bg-aoz-primary text-white rounded-full flex items-center justify-center font-semibold text-lg">
              {resident.code.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {resident.code}
              </h1>
              <p className="text-gray-500">
                {getLabel(AGE_RANGE_LABELS, resident.ageRange)} ·{' '}
                {getLabel(GENDER_LABELS, resident.gender)} ·{' '}
                {getLabel(FAMILY_STATUS_LABELS, resident.familyStatus)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${getStatusBadgeClass(resident.status)}`}>
            {getLabel(RESIDENT_STATUS_LABELS, resident.status)}
          </span>
          <Link href={`/matching?resident=${resident.id}`} className="btn-primary">
            Platzieren
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Placement */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Aktuelle Platzierung
            </h2>
            {currentPlacement ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center">
                    🏠
                  </div>
                  <div>
                    <Link
                      href={`/housing/${currentPlacement.housingUnitId}`}
                      className="font-medium text-gray-900 hover:text-aoz-primary"
                    >
                      {currentPlacement.housingUnit.code}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {currentPlacement.housingUnit.address}
                    </p>
                    <p className="text-sm text-gray-500">
                      Seit {formatDate(currentPlacement.startDate)}
                    </p>
                  </div>
                </div>
                {currentPlacement.compatibilityScore && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Kompatibilität</p>
                    <p
                      className={`text-lg font-semibold ${getScoreColorClass(
                        currentPlacement.compatibilityScore
                      )}`}
                    >
                      {Math.round(currentPlacement.compatibilityScore)}% -{' '}
                      {getScoreLabel(currentPlacement.compatibilityScore)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nicht platziert</p>
                <Link
                  href={`/matching?resident=${resident.id}`}
                  className="btn-primary"
                >
                  Passende Unterkunft finden
                </Link>
              </div>
            )}
          </div>

          {/* Compatibility with current roommates */}
          {resident.assessments.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Top Kompatibilitäten
              </h2>
              <div className="space-y-3">
                {resident.assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {assessment.comparedWith.code.slice(0, 2).toUpperCase()}
                      </div>
                      <Link
                        href={`/residents/${assessment.comparedWithId}`}
                        className="font-medium text-gray-900 hover:text-aoz-primary"
                      >
                        {assessment.comparedWith.code}
                      </Link>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgClass(
                        assessment.overallScore
                      )}`}
                    >
                      {Math.round(assessment.overallScore)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Incidents */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Vorfälle ({resident.incidents.length})
              </h2>
              {currentPlacement && (
                <Link
                  href={`/incidents/new?resident=${resident.id}&unit=${currentPlacement.housingUnitId}`}
                  className="btn-outline text-sm"
                >
                  Vorfall melden
                </Link>
              )}
            </div>
            {resident.incidents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Keine Vorfälle dokumentiert
              </p>
            ) : (
              <div className="space-y-3">
                {resident.incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-4 bg-gray-50 rounded-lg border-l-4 ${getSeverityBorderClass(
                      incident.severity
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {incident.description}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {incident.housingUnit.code} ·{' '}
                          {formatRelativeDate(incident.date)}
                        </p>
                      </div>
                      {incident.resolvedAt ? (
                        <span className="badge badge-active">Gelöst</span>
                      ) : (
                        <span className="badge badge-pending">Offen</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Placement History */}
          {pastPlacements.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Platzierungshistorie
              </h2>
              <div className="space-y-3">
                {pastPlacements.map((placement) => (
                  <div
                    key={placement.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <Link
                        href={`/housing/${placement.housingUnitId}`}
                        className="font-medium text-gray-900 hover:text-aoz-primary"
                      >
                        {placement.housingUnit.code}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {formatDate(placement.startDate)} -{' '}
                        {placement.endDate
                          ? formatDate(placement.endDate)
                          : 'heute'}
                      </p>
                    </div>
                    <div className="text-right">
                      {placement.endReason && (
                        <span className="badge badge-ended">
                          {getLabel(END_REASON_LABELS, placement.endReason)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Profile attributes */}
        <div className="space-y-6">
          {/* Lifestyle */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Lebensstil
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow
                label="Schlafrhythmus"
                value={getLabel(SLEEP_SCHEDULE_LABELS, resident.sleepSchedule)}
              />
              <DetailRow
                label="Lärmtoleranz"
                value={`${resident.noiseTolerance}/5`}
              />
              <DetailRow
                label="Sauberkeit"
                value={`${resident.cleanlinessLevel}/5`}
              />
            </dl>
          </div>

          {/* Social */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Soziales
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow
                label="Sozial"
                value={getLabel(SOCIAL_STYLE_LABELS, resident.socialStyle)}
              />
              <DetailRow
                label="Privatsphäre"
                value={`${resident.privacyNeed}/5`}
              />
              <div>
                <dt className="text-gray-500 mb-1">Sprachen</dt>
                <dd className="flex flex-wrap gap-1">
                  {resident.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-0.5 bg-gray-100 rounded text-xs"
                    >
                      {getLabel(LANGUAGE_LABELS, lang)}
                    </span>
                  ))}
                </dd>
              </div>
              {resident.culturalRegion && (
                <DetailRow label="Region" value={resident.culturalRegion} />
              )}
            </dl>
          </div>

          {/* Practical */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Praktisches
            </h2>
            <dl className="space-y-3 text-sm">
              <DetailRow
                label="Rauchen"
                value={getLabel(SMOKING_STATUS_LABELS, resident.smokingStatus)}
              />
              <DetailRow
                label="Mobilität"
                value={getLabel(MOBILITY_NEED_LABELS, resident.mobilityNeeds)}
              />
              {resident.dietaryNeeds.length > 0 && (
                <div>
                  <dt className="text-gray-500 mb-1">Ernährung</dt>
                  <dd className="flex flex-wrap gap-1">
                    {resident.dietaryNeeds.map((diet) => (
                      <span
                        key={diet}
                        className="px-2 py-0.5 bg-gray-100 rounded text-xs"
                      >
                        {getLabel(DIET_LABELS, diet)}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Preferences */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Präferenzen
            </h2>
            <div className="space-y-2 text-sm">
              <PreferenceItem
                label="Haustiere"
                value={resident.petTolerance}
              />
              <PreferenceItem
                label="Geteiltes Bad"
                value={resident.sharedBathroom}
              />
              <PreferenceItem
                label="Geteilte Küche"
                value={resident.sharedKitchen}
              />
              <PreferenceItem
                label="Med. Geräte"
                value={resident.medicalEquipment}
              />
            </div>
          </div>

          {/* Notes */}
          {resident.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notizen
              </h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {resident.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  )
}

function PreferenceItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className={value ? 'text-green-500' : 'text-gray-400'}>
        {value ? '✓' : '○'}
      </span>
      {label}
    </div>
  )
}
