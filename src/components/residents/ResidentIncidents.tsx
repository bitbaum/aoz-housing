import Link from 'next/link'
import type { Incident, HousingUnit } from '@prisma/client'
import {
  INCIDENT_TYPE_LABELS,
  RESIDENT_INCIDENTS_LABELS,
  getLabel,
} from '@/lib/constants'
import {
  getSeverityBorderClass,
  formatRelativeDate,
} from '@/lib/utils'
import { INCIDENT_THRESHOLDS, getIncidentLevel, INCIDENT_BG_COLORS } from '@/lib/config/thresholds'

type IncidentWithUnit = Incident & { housingUnit: HousingUnit }

interface ResidentIncidentsProps {
  incidentsAsSubject: IncidentWithUnit[]
  incidentsReportedCount: number
  currentPlacement: { id: string; housingUnitId: string } | null
  residentId: string
}

export function ResidentIncidents({
  incidentsAsSubject,
  incidentsReportedCount,
  currentPlacement,
  residentId,
}: ResidentIncidentsProps) {
  const subjectLevel = getIncidentLevel(incidentsAsSubject.length)

  return (
    <>
      {/* Incident Stats - Troublemaker Detection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {RESIDENT_INCIDENTS_LABELS.sectionTitle}
        </h2>
        {/* Warning banner for frequent subjects */}
        {incidentsAsSubject.length >= INCIDENT_THRESHOLDS.severe && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 text-lg">!</span>
              <p className="text-sm text-amber-800">
                {RESIDENT_INCIDENTS_LABELS.warningMessage(incidentsAsSubject.length)}{' '}
                {RESIDENT_INCIDENTS_LABELS.reviewRecommendation}
              </p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">{RESIDENT_INCIDENTS_LABELS.reportedLabel}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {incidentsReportedCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {RESIDENT_INCIDENTS_LABELS.reportedDesc}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${INCIDENT_BG_COLORS[subjectLevel]}`}>
            <p className="text-sm text-gray-500">{RESIDENT_INCIDENTS_LABELS.subjectLabel}</p>
            <p className={`text-2xl font-bold ${
              subjectLevel === 'severe'
                ? 'text-red-600'
                : subjectLevel !== 'none'
                  ? 'text-amber-600'
                  : 'text-gray-900'
            }`}>
              {incidentsAsSubject.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {RESIDENT_INCIDENTS_LABELS.subjectDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Incidents List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {RESIDENT_INCIDENTS_LABELS.subjectTitle(incidentsAsSubject.length)}
          </h2>
          {currentPlacement && (
            <Link
              href={`/incidents/new?subject=${residentId}&unit=${currentPlacement.housingUnitId}`}
              className="btn-outline text-sm"
            >
              {RESIDENT_INCIDENTS_LABELS.reportIncident}
            </Link>
          )}
        </div>
        {incidentsAsSubject.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {RESIDENT_INCIDENTS_LABELS.noIncidents}
          </p>
        ) : (
          <div className="space-y-3">
            {incidentsAsSubject.map((incident) => (
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
    </>
  )
}
