/**
 * Incident display components
 */

import { INCIDENT_TYPE_LABELS } from '@/lib/constants/labels'
import { formatRelativeDate, getSeverityBorderClass } from '@/lib/utils/formatting'
import { Badge } from './Badge'

interface IncidentCardProps {
  incident: {
    id: string
    date: Date | string
    type: string
    category: string
    severity: string
    description: string
    resolution?: string | null
    resolvedAt?: Date | string | null
    resident?: { code: string } | null
    housingUnit?: { code: string } | null
  }
  showUnit?: boolean
  showResident?: boolean
  compact?: boolean
}

export function IncidentCard({
  incident,
  showUnit = false,
  showResident = false,
  compact = false,
}: IncidentCardProps) {
  const categoryIcon = incident.category === 'MAINTENANCE' ? '🔧' :
                       incident.category === 'SAFETY' ? '⚠️' : '💬'

  const typeLabel = INCIDENT_TYPE_LABELS[incident.type] || incident.type

  if (compact) {
    return (
      <div className={`p-3 bg-gray-50 rounded-lg border-l-4 ${getSeverityBorderClass(incident.severity)}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900 text-sm">{typeLabel}</p>
            <p className="text-sm text-gray-500">
              {showUnit && incident.housingUnit && `${incident.housingUnit.code}`}
              {showUnit && incident.housingUnit && showResident && incident.resident && ' • '}
              {showResident && incident.resident && incident.resident.code}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{formatRelativeDate(incident.date)}</p>
            {!incident.resolvedAt && (
              <Badge variant="pending" className="text-xs">Offen</Badge>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-gray-50 rounded-lg border-l-4 ${getSeverityBorderClass(incident.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg">{categoryIcon}</span>
          <div>
            <p className="font-medium text-gray-900">{typeLabel}</p>
            <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
            {showResident && incident.resident && (
              <p className="text-sm text-gray-500 mt-1">
                Betrifft: {incident.resident.code}
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-500">{formatRelativeDate(incident.date)}</p>
          {incident.resolvedAt ? (
            <Badge variant="active">Gelöst</Badge>
          ) : (
            <Badge variant="pending">Offen</Badge>
          )}
        </div>
      </div>
      {incident.resolution && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Lösung:</span> {incident.resolution}
          </p>
        </div>
      )}
    </div>
  )
}
