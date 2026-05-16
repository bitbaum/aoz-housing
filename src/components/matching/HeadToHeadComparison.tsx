import type { Resident } from '@prisma/client'
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

/**
 * Config-driven comparison attributes (SSOT)
 */
const COMPARISON_ATTRIBUTES = [
  { key: 'cleanlinessLevel', label: 'Sauberkeit', type: 'numeric', avgKey: 'avgCleanlinessLevel', threshold: 'cleanliness' },
  { key: 'noiseTolerance', label: 'Lärmtoleranz', type: 'numeric', avgKey: 'avgNoiseTolerance', threshold: 'noiseTolerance' },
  { key: 'choresContribution', label: 'Hausarbeit', type: 'numeric', avgKey: 'avgChoresContribution', threshold: 'choresContribution' },
  { key: 'privacyNeed', label: 'Privatsphäre', type: 'numeric', avgKey: 'avgPrivacyNeed' },
  { key: 'sleepSchedule', label: 'Schlaf', type: 'enum', dominantKey: 'dominantSleepSchedule', labels: SLEEP_SCHEDULE_LABELS_SHORT },
  { key: 'socialStyle', label: 'Sozialstil', type: 'enum', dominantKey: 'dominantSocialStyle', labels: SOCIAL_STYLE_LABELS_SHORT },
  { key: 'smokingStatus', label: 'Rauchen', type: 'enum', dominantKey: 'dominantSmokingStatus', labels: SMOKING_STATUS_LABELS_SHORT },
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
      return diff <= 0.5 ? <span className="text-green-500">✓</span> : null
    }
    const thresholds = APARTMENT_THRESHOLDS[thresholdKey]
    if (!thresholds || typeof thresholds !== 'object') return null
    if ('BLOCKING' in thresholds && diff >= thresholds.BLOCKING) {
      return <span className="text-red-500 font-bold">🚫</span>
    }
    if ('HIGH' in thresholds && diff >= thresholds.HIGH) {
      return <span className="text-orange-500">⚠</span>
    }
    if (diff <= 0.5) {
      return <span className="text-green-500">✓</span>
    }
    return null
  }

  const getFormattedValue = (
    val: string | number | null,
    attr: typeof COMPARISON_ATTRIBUTES[number]
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
          const avgValue = attr.type === 'numeric'
            ? profile[attr.avgKey as string]
            : profile[attr.dominantKey as string]
          const newVal = (newResident as Record<string, unknown>)[attr.key]

          return (
            <div key={attr.key} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-600">{attr.label}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded" title={ALGORITHM_OVERVIEW_LABELS.headToHeadAvg}>
                  Ø {attr.type === 'numeric'
                    ? (avgValue as number | null)?.toFixed(1) || '–'
                    : avgValue ? getLabel(attr.labels as Record<string, string>, String(avgValue)) : '–'}
                </span>
                <span className="text-aoz-primary bg-aoz-primary/10 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5">
                  {getFormattedValue(newVal as string | number | null, attr)}
                  {attr.type === 'numeric' && getDiffIndicator(
                    newVal as number,
                    avgValue as number | null,
                    'threshold' in attr ? attr.threshold as ThresholdKey : undefined
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
            <tr className="bg-gray-100">
              <th scope="col" className="p-1.5 text-left font-semibold text-gray-600 border-b w-20">Attribut</th>
              {currentResidents.slice(0, DISPLAY_LIMITS.comparisonResidents).map((r) => (
                <th scope="col" key={r.id} className="p-1.5 text-center font-medium text-gray-500 border-b" style={{ minWidth: '50px' }}>
                  {r.code.slice(-3)}
                </th>
              ))}
              {currentResidents.length > DISPLAY_LIMITS.comparisonResidents && (
                <th scope="col" className="p-1.5 text-center text-gray-500 border-b">+{currentResidents.length - DISPLAY_LIMITS.comparisonResidents}</th>
              )}
              <th scope="col" className="p-1.5 text-center font-semibold text-blue-700 border-b bg-blue-50">Ø</th>
              <th scope="col" className="p-1.5 text-center font-semibold text-aoz-primary border-b bg-aoz-primary/10">Neu</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ATTRIBUTES.map((attr) => {
              const profile = apartmentProfile as unknown as Record<string, string | number | null>
              const avgValue = attr.type === 'numeric'
                ? profile[attr.avgKey as string]
                : profile[attr.dominantKey as string]

              return (
                <tr key={attr.key} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-1.5 font-medium text-gray-600">{attr.label}</td>
                  {currentResidents.slice(0, DISPLAY_LIMITS.comparisonResidents).map((r) => {
                    const val = (r as Record<string, unknown>)[attr.key] as string | number | null
                    return (
                      <td key={r.id} className="p-1.5 text-center text-gray-500">
                        {getFormattedValue(val, attr)}
                      </td>
                    )
                  })}
                  {currentResidents.length > DISPLAY_LIMITS.comparisonResidents && <td className="p-1.5 text-center text-gray-400">…</td>}
                  <td className="p-1.5 text-center font-medium bg-blue-50 text-blue-700">
                    {attr.type === 'numeric'
                      ? (avgValue as number | null)?.toFixed(1) || '–'
                      : avgValue ? getLabel(attr.labels as Record<string, string>, String(avgValue)) : '–'}
                  </td>
                  <td className="p-1.5 text-center font-medium bg-aoz-primary/10">
                    {(() => {
                      const newVal = (newResident as unknown as Record<string, unknown>)[attr.key] as string | number | null
                      return attr.type === 'numeric' ? (
                        <span className="inline-flex items-center gap-0.5">
                          {String(newVal)}
                          {getDiffIndicator(
                            newVal as number,
                            avgValue as number | null,
                            'threshold' in attr ? attr.threshold as ThresholdKey : undefined
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
