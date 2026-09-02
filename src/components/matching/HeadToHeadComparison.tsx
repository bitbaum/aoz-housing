import type { Resident } from '@/lib/db'
import type { ApartmentProfile } from '@/lib/compatibility/types'
import {
  SLEEP_SCHEDULE_LABELS_SHORT,
  SMOKING_STATUS_LABELS_SHORT,
  SOCIAL_STYLE_LABELS_SHORT,
  ALGORITHM_OVERVIEW_LABELS,
  getLabel,
} from '@/lib/constants'
import { APARTMENT_THRESHOLDS } from '@/lib/config/apartment-thresholds'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { residentInitials, residentName } from '@/lib/utils/resident-name'

/**
 * Config-driven comparison attributes (SSOT)
 */
const COMPARISON_ATTRIBUTES = [
  {
    key: 'cleanlinessPractice',
    label: 'Sauberkeit',
    type: 'numeric',
    avgKey: 'avgCleanlinessLevel',
    threshold: 'cleanliness',
  },
  {
    key: 'noiseTolerance',
    label: 'Lärmtoleranz',
    type: 'numeric',
    avgKey: 'avgNoiseTolerance',
    threshold: 'noiseTolerance',
  },
  {
    key: 'choresContribution',
    label: 'Hausarbeit',
    type: 'numeric',
    avgKey: 'avgChoresContribution',
    threshold: 'choresContribution',
  },
  { key: 'privacyNeed', label: 'Privatsphäre', type: 'numeric', avgKey: 'avgPrivacyNeed' },
  {
    key: 'sleepSchedule',
    label: 'Schlaf',
    type: 'enum',
    dominantKey: 'dominantSleepSchedule',
    labels: SLEEP_SCHEDULE_LABELS_SHORT,
  },
  {
    key: 'socialStyle',
    label: 'Sozialstil',
    type: 'enum',
    dominantKey: 'dominantSocialStyle',
    labels: SOCIAL_STYLE_LABELS_SHORT,
  },
  {
    key: 'smokingStatus',
    label: 'Rauchen',
    type: 'enum',
    dominantKey: 'dominantSmokingStatus',
    labels: SMOKING_STATUS_LABELS_SHORT,
  },
] as const

type ThresholdKey = 'cleanliness' | 'noiseTolerance' | 'choresContribution'

interface Props {
  currentResidents: Resident[]
  newResident: Resident
  apartmentProfile: ApartmentProfile
}

export function HeadToHeadComparison({ currentResidents, newResident, apartmentProfile }: Props) {
  if (currentResidents.length === 0) return null

  const getDiffIndicator = (newVal: number, avgVal: number | null, thresholdKey?: ThresholdKey) => {
    if (avgVal === null) return null
    const diff = Math.abs(newVal - avgVal)
    if (!thresholdKey) {
      return diff <= 0.5 ? <span className="text-status-success-text">✓</span> : null
    }
    const thresholds = APARTMENT_THRESHOLDS[thresholdKey]
    if (!thresholds || typeof thresholds !== 'object') return null
    if ('BLOCKING' in thresholds && diff >= thresholds.BLOCKING) {
      return <span className="text-status-error-text font-bold">🚫</span>
    }
    if ('HIGH' in thresholds && diff >= thresholds.HIGH) {
      return <span className="text-status-warning-text">⚠</span>
    }
    if (diff <= 0.5) {
      return <span className="text-status-success-text">✓</span>
    }
    return null
  }

  const getFormattedValue = (
    val: string | number | null,
    attr: (typeof COMPARISON_ATTRIBUTES)[number],
  ) => {
    return attr.type === 'numeric'
      ? String(val)
      : getLabel(attr.labels as Record<string, string>, String(val))
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden space-y-2">
        {COMPARISON_ATTRIBUTES.map((attr) => {
          const profile = apartmentProfile as unknown as Record<string, unknown>
          const avgValue =
            attr.type === 'numeric'
              ? profile[attr.avgKey as string]
              : profile[attr.dominantKey as string]
          const newVal = (newResident as Record<string, unknown>)[attr.key]

          return (
            <div
              key={attr.key}
              className="flex items-center justify-between py-2 border-b border-ui-border"
            >
              <span className="text-xs font-medium text-ui-muted">{attr.label}</span>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className="text-brand-secondary bg-brand-secondary/10 px-1.5 py-0.5 rounded"
                  title={ALGORITHM_OVERVIEW_LABELS.headToHeadAvg}
                >
                  Ø{' '}
                  {attr.type === 'numeric'
                    ? (avgValue as number | null)?.toFixed(1) || '–'
                    : avgValue
                      ? getLabel(attr.labels as Record<string, string>, String(avgValue))
                      : '–'}
                </span>
                <span className="text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5">
                  {getFormattedValue(newVal as string | number | null, attr)}
                  {attr.type === 'numeric' &&
                    getDiffIndicator(
                      newVal as number,
                      avgValue as number | null,
                      'threshold' in attr ? (attr.threshold as ThresholdKey) : undefined,
                    )}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-ui-subtle">
              <th scope="col" className="p-1.5 text-left font-semibold text-ui-muted border-b w-20">
                Attribut
              </th>
              {currentResidents.slice(0, DISPLAY_LIMITS.comparisonResidents).map((r) => (
                <th
                  scope="col"
                  key={r.id}
                  title={residentName(r)}
                  className="p-1.5 text-center font-medium text-ui-muted border-b"
                  style={{ minWidth: '50px' }}
                >
                  {residentInitials(r)}
                </th>
              ))}
              {currentResidents.length > DISPLAY_LIMITS.comparisonResidents && (
                <th scope="col" className="p-1.5 text-center text-ui-muted border-b">
                  +{currentResidents.length - DISPLAY_LIMITS.comparisonResidents}
                </th>
              )}
              <th
                scope="col"
                className="p-1.5 text-center font-semibold text-brand-secondary border-b bg-brand-secondary/10"
              >
                Ø
              </th>
              <th
                scope="col"
                className="p-1.5 text-center font-semibold text-brand-primary border-b bg-brand-primary/10"
              >
                Neu
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ATTRIBUTES.map((attr) => {
              const profile = apartmentProfile as unknown as Record<string, string | number | null>
              const avgValue =
                attr.type === 'numeric'
                  ? profile[attr.avgKey as string]
                  : profile[attr.dominantKey as string]

              return (
                <tr key={attr.key} className="border-b border-ui-border hover:bg-ui-subtle/50">
                  <td className="p-1.5 font-medium text-ui-muted">{attr.label}</td>
                  {currentResidents.slice(0, DISPLAY_LIMITS.comparisonResidents).map((r) => {
                    const val = (r as Record<string, unknown>)[attr.key] as string | number | null
                    return (
                      <td key={r.id} className="p-1.5 text-center text-ui-muted">
                        {getFormattedValue(val, attr)}
                      </td>
                    )
                  })}
                  {currentResidents.length > DISPLAY_LIMITS.comparisonResidents && (
                    <td className="p-1.5 text-center text-ui-muted">…</td>
                  )}
                  <td className="p-1.5 text-center font-medium bg-brand-secondary/10 text-brand-secondary">
                    {attr.type === 'numeric'
                      ? (avgValue as number | null)?.toFixed(1) || '–'
                      : avgValue
                        ? getLabel(attr.labels as Record<string, string>, String(avgValue))
                        : '–'}
                  </td>
                  <td className="p-1.5 text-center font-medium bg-brand-primary/10">
                    {(() => {
                      const newVal = (newResident as unknown as Record<string, unknown>)[
                        attr.key
                      ] as string | number | null
                      return attr.type === 'numeric' ? (
                        <span className="inline-flex items-center gap-0.5">
                          {String(newVal)}
                          {getDiffIndicator(
                            newVal as number,
                            avgValue as number | null,
                            'threshold' in attr ? (attr.threshold as ThresholdKey) : undefined,
                          )}
                        </span>
                      ) : (
                        getLabel(attr.labels as Record<string, string>, String(newVal))
                      )
                    })()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
