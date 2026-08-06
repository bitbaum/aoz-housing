import type { Resident, Placement } from '@prisma/client'
import type { ApartmentConflict, ApartmentProfile, ApartmentCompatibility } from '@/lib/compatibility/types'
import {
  SLEEP_SCHEDULE_LABELS,
  SMOKING_STATUS_LABELS,
  SOCIAL_STYLE_LABELS,
  MATCHING_LABELS,
  getLabel,
} from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { getScoreColorClass } from '@/lib/utils/formatting'
import { HeadToHeadComparison } from './HeadToHeadComparison'

function formatConflictValue(attribute: string, value: string | number): string {
  if (typeof value === 'number') {
    return value.toFixed(1)
  }
  switch (attribute) {
    case 'sleepSchedule':
      return getLabel(SLEEP_SCHEDULE_LABELS, value)
    case 'smokingStatus':
      return getLabel(SMOKING_STATUS_LABELS, value)
    case 'socialStyle':
      return getLabel(SOCIAL_STYLE_LABELS, value)
    default:
      return value
  }
}

interface ApartmentProfileSectionProps {
  apartmentProfile: ApartmentProfile
  apartmentFit: ApartmentCompatibility
  placements: (Placement & { resident: Resident })[]
  newResident: Resident
}

export function ApartmentProfileSection({
  apartmentProfile,
  apartmentFit,
  placements,
  newResident,
}: ApartmentProfileSectionProps) {
  if (apartmentProfile.isEmpty) return null

  return (
    <div className="mb-3 p-3 bg-brand-secondary/8 border border-brand-secondary/20 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-brand-secondary uppercase">
          {MATCHING_LABELS.apartmentProfile} ({apartmentProfile.currentResidentCount} {MATCHING_LABELS.residents})
        </p>
        <span className={`text-sm font-bold ${getScoreColorClass(apartmentFit.fitScore)}`}>
          {apartmentFit.fitScore}% {MATCHING_LABELS.matching}
        </span>
      </div>

      <HeadToHeadComparison
        currentResidents={placements.map((p) => p.resident)}
        newResident={newResident}
        apartmentProfile={apartmentProfile}
      />

      {apartmentFit.conflicts.filter((c: ApartmentConflict) => c.severity === 'BLOCKING' || c.severity === 'HIGH').length > 0 && (
        <div className="space-y-1">
          {apartmentFit.conflicts
            .filter((c: ApartmentConflict) => c.severity === 'BLOCKING' || c.severity === 'HIGH')
            .map((conflict: ApartmentConflict, i: number) => (
              <p key={i} className={`text-xs ${
                conflict.severity === 'BLOCKING' ? 'text-status-error-text font-medium' : 'text-status-warning-text'
              }`}>
                {conflict.severity === 'BLOCKING' ? '🚫' : '⚠️'} {conflict.message}
              </p>
            ))
          }
        </div>
      )}

      {apartmentFit.strengths.length > 0 && apartmentFit.conflicts.filter((c: ApartmentConflict) => c.severity === 'BLOCKING' || c.severity === 'HIGH').length === 0 && (
        <div className="space-y-1">
          {apartmentFit.strengths.slice(0, DISPLAY_LIMITS.matchStrengths).map((strength: string, i: number) => (
            <p key={i} className="text-xs text-status-success-text">✓ {strength}</p>
          ))}
        </div>
      )}

      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-brand-secondary hover:text-brand-secondary-dark font-medium">
          📊 {MATCHING_LABELS.scoreDerivation}
        </summary>
        <div className="mt-2 p-2 bg-ui-surface border border-brand-secondary/15 rounded text-ui-muted">
          <p className="font-semibold mb-1">Fit Score: {apartmentFit.fitScore}%</p>
          <p className="text-ui-muted mb-2">{MATCHING_LABELS.basePenalty}</p>

          {apartmentFit.conflicts.length > 0 && (
            <div className="mb-2">
              <p className="font-medium text-status-error-text">{MATCHING_LABELS.conflictDeductions}</p>
              {apartmentFit.conflicts.map((c: ApartmentConflict, i: number) => (
                <p key={i} className="ml-2">
                  • {c.attribute}: -{c.severity === 'BLOCKING' ? 40 : c.severity === 'HIGH' ? 20 : c.severity === 'MEDIUM' ? 10 : 5}
                  <span className="text-ui-muted ml-1">
                    ({formatConflictValue(c.attribute, c.residentValue)} vs {formatConflictValue(c.attribute, c.apartmentAverage)})
                  </span>
                </p>
              ))}
            </div>
          )}

          {apartmentFit.strengths.length > 0 && (
            <div className="mb-2">
              <p className="font-medium text-status-success-text">{MATCHING_LABELS.strengthBonus} +{Math.min(apartmentFit.strengths.length * 3, 20)}</p>
              {apartmentFit.strengths.map((s: string, i: number) => (
                <p key={i} className="ml-2 text-status-success-text">• {s}</p>
              ))}
            </div>
          )}

          {apartmentProfile.currentResidentCount <= 2 && (
            <p className="text-status-success-text">{MATCHING_LABELS.smallGroupBonus} +5</p>
          )}

          <p className="mt-2 pt-2 border-t border-ui-border font-semibold">
            = {apartmentFit.fitScore}% {MATCHING_LABELS.totalFit}
          </p>
        </div>
      </details>
    </div>
  )
}
