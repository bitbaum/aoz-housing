'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertTriangle, Hand, Home, AlertCircle, Sparkles } from 'lucide-react'
import { VERY_OVERDUE_THRESHOLD_DAYS } from '@/lib/config/checkin-intervals'
import { INCIDENT_TYPE_LABELS_SHORT, DASHBOARD_LABELS, UI_LABELS } from '@/lib/constants/labels'
import type { CriticalIncident, OverdueCheckIn, UnplacedResident, ProblemUnit } from './types'

// =============================================================================
// Types
// =============================================================================

export interface PrimaryActionType {
  type: 'critical' | 'checkin' | 'place' | 'problem' | 'allclear'
  title: string
  description: string
  href: string
  buttonText: string
  count?: number
}

// =============================================================================
// determinePrimaryAction
// =============================================================================

export function determinePrimaryAction({
  criticalIncidents,
  overdueCheckIns,
  unplacedResidents,
  freeBeds,
  problemUnits,
}: {
  criticalIncidents: CriticalIncident[]
  overdueCheckIns: OverdueCheckIn[]
  unplacedResidents: UnplacedResident[]
  freeBeds: number
  problemUnits: ProblemUnit[]
}): PrimaryActionType {
  // Priority 1: Critical incidents
  if (criticalIncidents.length > 0) {
    return {
      type: 'critical',
      title: `${criticalIncidents.length} ${DASHBOARD_LABELS.heroCriticalIncidentsSuffix}`,
      description: `${INCIDENT_TYPE_LABELS_SHORT[criticalIncidents[0].type] || criticalIncidents[0].type} in ${criticalIncidents[0].unitCode}`,
      href: `/incidents/${criticalIncidents[0].id}`,
      buttonText: DASHBOARD_LABELS.heroActionNow,
      count: criticalIncidents.length,
    }
  }

  // Priority 2: Very overdue check-ins (using config threshold)
  const veryOverdue = overdueCheckIns.filter(c => c.isVeryOverdue || c.daysSinceLastCheckIn > VERY_OVERDUE_THRESHOLD_DAYS + 28)
  if (veryOverdue.length > 0) {
    return {
      type: 'checkin',
      title: `${DASHBOARD_LABELS.heroCheckInUrgentPrefix} ${veryOverdue[0].residentCode}`,
      description: `${DASHBOARD_LABELS.tileSincePrefix} ${veryOverdue[0].daysSinceLastCheckIn} ${DASHBOARD_LABELS.heroNotSeenSuffix}`,
      href: `/residents/${veryOverdue[0].residentId}`,
      buttonText: DASHBOARD_LABELS.heroStartCheckIn,
      count: veryOverdue.length,
    }
  }

  // Priority 3: Unplaced residents with available beds
  if (unplacedResidents.length > 0 && freeBeds > 0) {
    return {
      type: 'place',
      title: `${unplacedResidents.length} ${DASHBOARD_LABELS.heroPlaceResidentsSuffix}`,
      description: `${freeBeds} ${DASHBOARD_LABELS.heroFreeBedsAvailableSuffix}`,
      href: '/matching',
      buttonText: DASHBOARD_LABELS.actionStartMatching,
      count: unplacedResidents.length,
    }
  }

  // Priority 4: Problem units with unresolved incidents
  const unitsWithUnresolved = problemUnits.filter(u => u.unresolvedCount > 0)
  if (unitsWithUnresolved.length > 0) {
    const topUnit = unitsWithUnresolved[0]
    return {
      type: 'problem',
      title: `${topUnit.code}: ${topUnit.unresolvedCount} ${DASHBOARD_LABELS.heroOpenConflictsSuffix}`,
      description: `${DASHBOARD_LABELS.heroMainProblemPrefix} ${INCIDENT_TYPE_LABELS_SHORT[topUnit.primaryIssue] || topUnit.primaryIssue}`,
      href: `/housing/${topUnit.id}`,
      buttonText: DASHBOARD_LABELS.heroAnalyze,
      count: unitsWithUnresolved.length,
    }
  }

  // Priority 5: Regular overdue check-ins
  if (overdueCheckIns.length > 0) {
    return {
      type: 'checkin',
      title: `${overdueCheckIns.length} ${DASHBOARD_LABELS.heroCheckInsPendingSuffix}`,
      description: `${DASHBOARD_LABELS.heroNextPrefix} ${overdueCheckIns[0].residentCode}`,
      href: `/residents/${overdueCheckIns[0].residentId}`,
      buttonText: DASHBOARD_LABELS.heroStartCheckIn,
      count: overdueCheckIns.length,
    }
  }

  // Priority 6: Problem units (all resolved but worth monitoring)
  if (problemUnits.length > 0) {
    return {
      type: 'problem',
      title: `${problemUnits.length} ${DASHBOARD_LABELS.heroMonitorUnitsSuffix}`,
      description: `${problemUnits[0].code} ${DASHBOARD_LABELS.heroHadSuffix} ${problemUnits[0].incidentCount} ${DASHBOARD_LABELS.heroIncidentsSuffix}`,
      href: `/housing/${problemUnits[0].id}`,
      buttonText: DASHBOARD_LABELS.heroReview,
      count: problemUnits.length,
    }
  }

  // All clear!
  return {
    type: 'allclear',
    title: DASHBOARD_LABELS.allClearAllDone,
    description: DASHBOARD_LABELS.allClearNoDringend,
    href: '/residents/new',
    buttonText: DASHBOARD_LABELS.actionCreateResident,
  }
}

// =============================================================================
// HeroAction
// =============================================================================

export function HeroAction({ action }: { action: PrimaryActionType }) {
  const colorStyles = {
    critical: 'bg-status-error text-ui-on-accent',
    checkin: 'bg-status-warning text-ui-on-accent',
    place: 'bg-brand-secondary text-ui-on-accent',
    problem: 'bg-status-warning text-ui-on-accent',
    allclear: 'bg-status-success text-ui-on-accent',
  }

  const icons = {
    critical: AlertTriangle,
    checkin: Hand,
    place: Home,
    problem: AlertCircle,
    allclear: Sparkles,
  }

  const IconComponent = icons[action.type]

  return (
    <Link
      href={action.href}
      className={`block rounded-lg p-6 md:p-8 ${colorStyles[action.type]} transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconComponent className="w-10 h-10 shrink-0" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{action.title}</h2>
            <p className="text-ui-on-accent/80 mt-1">{action.description}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="px-4 py-2 bg-ui-surface/20 rounded-md font-semibold">
            {action.buttonText} →
          </span>
        </div>
      </div>
      <div className="md:hidden mt-4">
        <span className="inline-block px-4 py-2 bg-ui-surface/20 rounded-md font-semibold">
          {action.buttonText} →
        </span>
      </div>
    </Link>
  )
}

// =============================================================================
// CriticalAlertBanner
// =============================================================================

export function CriticalAlertBanner({ incidents }: { incidents: CriticalIncident[] }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const incidentLabel = INCIDENT_TYPE_LABELS_SHORT[incidents[0].type] || incidents[0].type

  return (
    <div className="bg-status-error text-ui-on-accent px-4 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-pulse">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 shrink-0" />
        <div>
          <span className="font-bold">{incidents.length} {DASHBOARD_LABELS.alertCriticalAttentionSuffix}</span>
          <span className="ml-2 opacity-80">• {incidentLabel} in {incidents[0].unitCode}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Link
          href={`/incidents/${incidents[0].id}`}
          className="px-3 py-1 bg-ui-surface text-status-error rounded font-medium hover:bg-status-error/8"
        >
          {DASHBOARD_LABELS.alertEdit}
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-status-error/80 rounded"
          aria-label={UI_LABELS.close}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
