import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  SPOT_TYPE_ICONS,
} from '@/lib/config/placement-spots'
import { getEligibleSpotTypes } from '@/lib/config/placement-spots'
import { PlacementActions } from '@/components/residents/PlacementActions'
import { calculateCompatibility } from '@/lib/compatibility/scoring'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
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
  RECYCLING_KNOWLEDGE_LABELS,
  ROOM_SHARING_STATUS_LABELS,
  SUPPORT_LEVEL_LABELS,
  CHECK_IN_TYPE_LABELS,
  MEDICAL_DOC_TYPE_LABELS,
  getLabel,
} from '@/lib/constants'
import { getPlacementCheckIns } from '@/lib/actions'
import {
  getStatusBadgeClass,
  getScoreLabel,
  getScoreColorClass,
  getScoreBgClass,
  getSeverityBorderClass,
  formatRelativeDate,
  formatDate,
} from '@/lib/utils'
import { DetailRow } from '@/components/ui/Card'

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
          spot: true,
        },
        orderBy: { startDate: 'desc' },
      },
      incidentsAsSubject: {
        include: {
          housingUnit: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      },
      incidentsReported: {
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

  // Fetch available housing units with their available spots for transfer
  const availableUnits = await prisma.housingUnit.findMany({
    where: {
      status: { in: ['AVAILABLE', 'FULL'] },
    },
    include: {
      spots: {
        where: {
          status: 'AVAILABLE',
          type: { not: 'ROOM' }, // Only assignable spots
        },
        orderBy: { code: 'asc' },
      },
    },
    orderBy: { code: 'asc' },
  })

  if (!resident) {
    notFound()
  }

  const currentPlacement = resident.placements.find((p) => p.status === 'ACTIVE')
  const pastPlacements = resident.placements.filter((p) => p.status !== 'ACTIVE')

  // For unplaced residents: calculate compatible matches
  let compatibleUnits: { unit: any; fitScore: number; residents: number }[] = []
  let compatibleResidents: { resident: any; score: number }[] = []

  if (!currentPlacement) {
    const residentProfile = toResidentProfile(resident)

    // Get units with current residents for apartment-level matching
    const unitsWithResidents = await prisma.housingUnit.findMany({
      where: { status: { in: ['AVAILABLE', 'FULL'] } },
      include: {
        placements: {
          where: { status: 'ACTIVE' },
          include: { resident: true },
        },
        spots: { where: { status: 'AVAILABLE' } },
      },
    })

    // Calculate fit for each unit
    compatibleUnits = unitsWithResidents
      .filter(u => u.spots.length > 0) // Has available spots
      .map(unit => {
        const currentResidents = unit.placements.map(p => toResidentProfile(p.resident))
        const apartmentProfile = calculateApartmentProfile(currentResidents)
        const fit = calculateApartmentFit(residentProfile, apartmentProfile)
        return { unit, fitScore: fit.fitScore, residents: currentResidents.length }
      })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3)

    // Get other unplaced residents for pairing
    const otherUnplaced = await prisma.resident.findMany({
      where: {
        id: { not: resident.id },
        status: 'ACTIVE',
        placements: { none: { status: 'ACTIVE' } },
      },
    })

    // Calculate pairwise compatibility
    compatibleResidents = otherUnplaced
      .map(other => {
        const otherProfile = toResidentProfile(other)
        const compat = calculateCompatibility(residentProfile, otherProfile)
        return { resident: other, score: compat.overall }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

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
          <Link href={`/residents/${resident.id}/edit`} className="btn-outline">
            Bearbeiten
          </Link>
          {!currentPlacement && (
            <Link href={`/matching?resident=${resident.id}`} className="btn-primary">
              Platzieren
            </Link>
          )}
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
              <div className="space-y-4">
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
                      {currentPlacement.spot && (
                        <p className="text-sm text-gray-500">
                          {SPOT_TYPE_ICONS[currentPlacement.spot.type as keyof typeof SPOT_TYPE_ICONS]}{' '}
                          {currentPlacement.spot.label || currentPlacement.spot.code}
                        </p>
                      )}
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

                {/* Actions Section - Client Component */}
                <PlacementActions
                  placementId={currentPlacement.id}
                  residentId={resident.id}
                  currentUnitId={currentPlacement.housingUnitId}
                  hasMedicalDocumentation={resident.hasMedicalDocumentation}
                  availableUnits={availableUnits.map((u) => ({
                    id: u.id,
                    code: u.code,
                    address: u.address,
                    spots: u.spots.map((s) => ({
                      id: s.id,
                      code: s.code,
                      type: s.type,
                      label: s.label,
                    })),
                  }))}
                  eligibleSpotTypes={getEligibleSpotTypes(
                    resident.hasMedicalDocumentation,
                    resident.medicalDocType
                  )}
                />
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

          {/* Compatible Matches for Unplaced Residents */}
          {!currentPlacement && (compatibleUnits.length > 0 || compatibleResidents.length > 0) && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Passende Optionen
              </h2>

              {/* Compatible Units */}
              {compatibleUnits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Beste Unterkünfte</h3>
                  <div className="space-y-2">
                    {compatibleUnits.map(({ unit, fitScore, residents }) => (
                      <Link
                        key={unit.id}
                        href={`/matching?resident=${resident.id}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{unit.code}</p>
                          <p className="text-xs text-gray-500">
                            {residents === 0 ? 'Leer' : `${residents} Bewohner`}
                          </p>
                        </div>
                        <span className={`text-sm font-bold ${
                          fitScore >= 80 ? 'text-green-600' :
                          fitScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {fitScore}%
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatible Unplaced Residents */}
              {compatibleResidents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Passende Mitbewohner (unplatziert)</h3>
                  <div className="space-y-2">
                    {compatibleResidents.map(({ resident: other, score }) => (
                      <Link
                        key={other.id}
                        href={`/residents/${other.id}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm">
                            {other.code.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{other.code}</p>
                            <p className="text-xs text-gray-500">
                              {other.languages?.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${
                          score >= 80 ? 'text-green-600' :
                          score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(score)}%
                        </span>
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Diese Bewohner könnten zusammen platziert werden.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Satisfaction Check-ins History */}
          {currentPlacement && (
            <SatisfactionHistory placementId={currentPlacement.id} />
          )}

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

          {/* Incident Stats - Troublemaker Detection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Vorfallstatistik
            </h2>
            {/* Warning banner for frequent subjects */}
            {resident.incidentsAsSubject.length >= 3 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 text-lg">!</span>
                  <p className="text-sm text-amber-800">
                    Diese Person war in {resident.incidentsAsSubject.length} Vorfällen betroffen.
                    Eine Überprüfung der Platzierung wird empfohlen.
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Gemeldet</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resident.incidentsReported.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Vorfälle von dieser Person gemeldet
                </p>
              </div>
              <div className={`p-4 rounded-lg ${
                resident.incidentsAsSubject.length >= 3
                  ? 'bg-red-50'
                  : resident.incidentsAsSubject.length >= 1
                    ? 'bg-amber-50'
                    : 'bg-gray-50'
              }`}>
                <p className="text-sm text-gray-500">Betroffen</p>
                <p className={`text-2xl font-bold ${
                  resident.incidentsAsSubject.length >= 3
                    ? 'text-red-600'
                    : resident.incidentsAsSubject.length >= 1
                      ? 'text-amber-600'
                      : 'text-gray-900'
                }`}>
                  {resident.incidentsAsSubject.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Vorfälle über diese Person
                </p>
              </div>
            </div>
          </div>

          {/* Recent Incidents List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Vorfälle über diese Person ({resident.incidentsAsSubject.length})
              </h2>
              {currentPlacement && (
                <Link
                  href={`/incidents/new?subject=${resident.id}&unit=${currentPlacement.housingUnitId}`}
                  className="btn-outline text-sm"
                >
                  Vorfall melden
                </Link>
              )}
            </div>
            {resident.incidentsAsSubject.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Keine Vorfälle dokumentiert
              </p>
            ) : (
              <div className="space-y-3">
                {resident.incidentsAsSubject.map((incident) => (
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
                Platzierungshistorie ({pastPlacements.length})
              </h2>
              <div className="space-y-3">
                {pastPlacements.map((placement) => (
                  <div
                    key={placement.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      placement.status === 'TRANSFERRED'
                        ? 'bg-blue-50 border-l-4 border-blue-400'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/housing/${placement.housingUnitId}`}
                          className="font-medium text-gray-900 hover:text-aoz-primary"
                        >
                          {placement.housingUnit.code}
                        </Link>
                        {placement.status === 'TRANSFERRED' && (
                          <span className="text-blue-500 text-sm">🔄</span>
                        )}
                      </div>
                      {placement.spot && (
                        <p className="text-sm text-gray-500">
                          {SPOT_TYPE_ICONS[placement.spot.type as keyof typeof SPOT_TYPE_ICONS]}{' '}
                          {placement.spot.label || placement.spot.code}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {formatDate(placement.startDate)} -{' '}
                        {placement.endDate
                          ? formatDate(placement.endDate)
                          : 'heute'}
                      </p>
                    </div>
                    <div className="text-right">
                      {placement.status === 'TRANSFERRED' ? (
                        <span className="badge bg-blue-100 text-blue-800">
                          Verlegt
                        </span>
                      ) : placement.endReason ? (
                        <span className="badge badge-ended">
                          {getLabel(END_REASON_LABELS, placement.endReason)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Profile attributes - Reorganized for clarity */}
        <div className="space-y-6">
          {/* CRITICAL: Housing Authorization - Most important info at top */}
          <div className={`card border-2 ${resident.hasMedicalDocumentation ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🏠 Unterkunftsberechtigung
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-gray-600">Ärztliche Dokumentation</dt>
                <dd className={`font-semibold ${resident.hasMedicalDocumentation ? 'text-blue-700' : 'text-gray-500'}`}>
                  {resident.hasMedicalDocumentation ? '✓ Vorhanden' : '✗ Keine'}
                </dd>
              </div>
              {resident.hasMedicalDocumentation && resident.medicalDocType && (
                <div className="flex justify-between items-center">
                  <dt className="text-gray-600">Berechtigung für</dt>
                  <dd className="font-semibold text-blue-700">
                    {getLabel(MEDICAL_DOC_TYPE_LABELS, resident.medicalDocType)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between items-center">
                <dt className="text-gray-600">Zimmerteilung</dt>
                <dd className="font-medium text-gray-900">
                  {getLabel(ROOM_SHARING_STATUS_LABELS, resident.roomSharingStatus)}
                </dd>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <dt className="text-gray-500 text-xs mb-1">Erlaubte Platztypen</dt>
                <dd className="flex flex-wrap gap-1">
                  {getEligibleSpotTypes(resident.hasMedicalDocumentation, resident.medicalDocType).map((type) => (
                    <span
                      key={type}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        type === 'BED' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {SPOT_TYPE_ICONS[type as keyof typeof SPOT_TYPE_ICONS]} {type === 'BED' ? 'Bett' : type === 'PRIVATE_ROOM' ? 'Einzelzimmer' : 'Studio'}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Lifestyle & Daily Habits - Combined */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Lebensstil
            </h2>
            <dl className="space-y-2 text-sm">
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
              <DetailRow
                label="Sozialstil"
                value={getLabel(SOCIAL_STYLE_LABELS, resident.socialStyle)}
              />
              <DetailRow
                label="Privatsphäre"
                value={`${resident.privacyNeed}/5`}
              />
              <DetailRow
                label="Rauchen"
                value={getLabel(SMOKING_STATUS_LABELS, resident.smokingStatus)}
              />
            </dl>
          </div>

          {/* Languages & Background */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sprachen & Herkunft
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500 mb-2">Sprachen</dt>
                <dd className="flex flex-wrap gap-1">
                  {resident.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-1 bg-aoz-accent text-aoz-secondary rounded text-xs font-medium"
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

          {/* Household & Independence */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Haushalt & Selbständigkeit
            </h2>
            <dl className="space-y-2 text-sm">
              <DetailRow
                label="Haushaltsbereitschaft"
                value={`${resident.choresContribution}/5`}
              />
              <DetailRow
                label="Recycling"
                value={getLabel(RECYCLING_KNOWLEDGE_LABELS, resident.recyclingKnowledge)}
              />
              <DetailRow
                label="Mobilität"
                value={getLabel(MOBILITY_NEED_LABELS, resident.mobilityNeeds)}
              />
              <DetailRow
                label="Betreuungsstufe"
                value={getLabel(SUPPORT_LEVEL_LABELS, resident.supportLevel)}
              />
            </dl>
          </div>

          {/* Special Needs - Combined */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Besondere Bedürfnisse
            </h2>
            <div className="space-y-2 text-sm">
              <PreferenceItem
                label="Nächtliche Unruhe"
                value={resident.hasNightDisturbances}
              />
              <PreferenceItem
                label="Ruhige Umgebung nötig"
                value={resident.needsQuietEnvironment}
              />
              <PreferenceItem
                label="Schlafgeräte"
                value={resident.hasSleepEquipment}
              />
              <PreferenceItem
                label="Med. Geräte"
                value={resident.medicalEquipment}
              />
              {resident.dietaryNeeds.length > 0 && (
                <div className="pt-2">
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
            </div>
          </div>

          {/* Sharing Preferences */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Teilen & Präferenzen
            </h2>
            <div className="space-y-2 text-sm">
              <PreferenceItem
                label="Geteiltes Bad"
                value={resident.sharedBathroom}
              />
              <PreferenceItem
                label="Geteilte Küche"
                value={resident.sharedKitchen}
              />
              <PreferenceItem
                label="Haustiere"
                value={resident.petTolerance}
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

async function SatisfactionHistory({ placementId }: { placementId: string }) {
  const checkIns = await getPlacementCheckIns(placementId)

  if (checkIns.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Zufriedenheits-Check-ins
        </h2>
        <p className="text-gray-500 text-sm">
          Noch keine Check-ins erfasst.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Zufriedenheits-Check-ins ({checkIns.length})
      </h2>
      <div className="space-y-3">
        {checkIns.map((checkIn) => (
          <div
            key={checkIn.id}
            className="p-3 bg-gray-50 rounded-lg border-l-4"
            style={{
              borderLeftColor:
                checkIn.overallSatisfaction >= 4
                  ? '#22c55e'
                  : checkIn.overallSatisfaction >= 3
                  ? '#eab308'
                  : '#ef4444',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {checkIn.overallSatisfaction === 1
                    ? '😢'
                    : checkIn.overallSatisfaction === 2
                    ? '😕'
                    : checkIn.overallSatisfaction === 3
                    ? '😐'
                    : checkIn.overallSatisfaction === 4
                    ? '🙂'
                    : '😊'}
                </span>
                <div>
                  <span className="font-medium text-gray-900">
                    {CHECK_IN_TYPE_LABELS[checkIn.checkInType] || checkIn.checkInType}
                  </span>
                  {checkIn.weekNumber && (
                    <span className="text-gray-500 text-sm ml-2">
                      Woche {checkIn.weekNumber}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(checkIn.createdAt)}
              </span>
            </div>

            {/* Detailed scores if available */}
            {(checkIn.roommateRelations || checkIn.facilitySatisfaction || checkIn.safetyFeeling) && (
              <div className="flex gap-4 text-xs text-gray-600 mb-2">
                {checkIn.roommateRelations && (
                  <span>Mitbewohner: {checkIn.roommateRelations}/5</span>
                )}
                {checkIn.facilitySatisfaction && (
                  <span>Einrichtung: {checkIn.facilitySatisfaction}/5</span>
                )}
                {checkIn.safetyFeeling && (
                  <span>Sicherheit: {checkIn.safetyFeeling}/5</span>
                )}
              </div>
            )}

            {/* Concerns highlighted */}
            {checkIn.concerns && (
              <div className="text-sm text-red-700 bg-red-50 p-2 rounded mt-2">
                <span className="font-medium">Anliegen:</span> {checkIn.concerns}
              </div>
            )}

            {/* Improvements */}
            {checkIn.improvements && (
              <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded mt-2">
                <span className="font-medium">Verbesserungen:</span> {checkIn.improvements}
              </div>
            )}

            {/* Positives */}
            {checkIn.positives && (
              <div className="text-sm text-green-700 bg-green-50 p-2 rounded mt-2">
                <span className="font-medium">Positives:</span> {checkIn.positives}
              </div>
            )}

            {/* Collector info */}
            {checkIn.collectedBy && !checkIn.isAnonymous && (
              <div className="text-xs text-gray-400 mt-2">
                Erfasst von: {checkIn.collectedBy}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
