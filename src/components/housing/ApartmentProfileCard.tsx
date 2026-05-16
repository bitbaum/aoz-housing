'use client'

import {
  SLEEP_SCHEDULE_LABELS,
  SOCIAL_STYLE_LABELS,
  SMOKING_STATUS_LABELS,
  LANGUAGE_LABELS,
  APARTMENT_PROFILE_LABELS,
  getLabel,
} from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'
import type { ResidentHouseholdProfile } from '@/lib/types'
import { RESIDENT_FACTORS } from '@/lib/config/resident-factors'

interface ApartmentProfileCardProps {
  residents: ResidentHouseholdProfile[]
  showDetails?: boolean
}

interface ProfileMetrics {
  // Scale averages (1-5)
  avgCleanliness: number
  avgNoiseTolerance: number
  avgPrivacyNeed: number
  avgChoresContribution: number

  // Categorical counts
  sleepSchedules: Record<string, number>
  socialStyles: Record<string, number>
  smokingStatuses: Record<string, number>

  // Languages
  languages: { code: string; count: number }[]

  // Harmony score (how similar are residents to each other)
  harmonyScore: number
}

function calculateProfileMetrics(residents: ResidentHouseholdProfile[]): ProfileMetrics {
  if (residents.length === 0) {
    return {
      avgCleanliness: 0,
      avgNoiseTolerance: 0,
      avgPrivacyNeed: 0,
      avgChoresContribution: 0,
      sleepSchedules: {},
      socialStyles: {},
      smokingStatuses: {},
      languages: [],
      harmonyScore: 100,
    }
  }

  const n = residents.length

  // Calculate averages
  const avgCleanliness = residents.reduce((sum, r) => sum + r.cleanlinessLevel, 0) / n
  const avgNoiseTolerance = residents.reduce((sum, r) => sum + r.noiseTolerance, 0) / n
  const avgPrivacyNeed = residents.reduce((sum, r) => sum + r.privacyNeed, 0) / n
  const avgChoresContribution = residents.reduce((sum, r) => sum + r.choresContribution, 0) / n

  // Count categorical values
  const sleepSchedules: Record<string, number> = {}
  const socialStyles: Record<string, number> = {}
  const smokingStatuses: Record<string, number> = {}
  const languageCounts: Record<string, number> = {}

  for (const r of residents) {
    sleepSchedules[r.sleepSchedule] = (sleepSchedules[r.sleepSchedule] || 0) + 1
    socialStyles[r.socialStyle] = (socialStyles[r.socialStyle] || 0) + 1
    smokingStatuses[r.smokingStatus] = (smokingStatuses[r.smokingStatus] || 0) + 1

    for (const lang of r.languages || []) {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1
    }
  }

  const languages = Object.entries(languageCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)

  // Calculate harmony score based on standard deviation of scale values
  const cleanlinessStdDev = calculateStdDev(residents.map(r => r.cleanlinessLevel))
  const noiseStdDev = calculateStdDev(residents.map(r => r.noiseTolerance))
  const privacyStdDev = calculateStdDev(residents.map(r => r.privacyNeed))

  // Lower std dev = higher harmony (max std dev for 1-5 scale is ~2)
  const avgStdDev = (cleanlinessStdDev + noiseStdDev + privacyStdDev) / 3
  const harmonyScore = Math.round(Math.max(0, 100 - (avgStdDev * 25)))

  return {
    avgCleanliness,
    avgNoiseTolerance,
    avgPrivacyNeed,
    avgChoresContribution,
    sleepSchedules,
    socialStyles,
    smokingStatuses,
    languages,
    harmonyScore,
  }
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length)
}

export function ApartmentProfileCard({ residents, showDetails = true }: ApartmentProfileCardProps) {
  const metrics = calculateProfileMetrics(residents)

  if (residents.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{APARTMENT_PROFILE_LABELS.title}</h2>
        <p className="text-gray-500 text-center py-4">{APARTMENT_PROFILE_LABELS.emptyState}</p>
      </div>
    )
  }

  const dominantSleepSchedule = Object.entries(metrics.sleepSchedules)
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  const dominantSocialStyle = Object.entries(metrics.socialStyles)
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  const hasNonSmokers = (metrics.smokingStatuses['NON_SMOKER'] || 0) === residents.length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{APARTMENT_PROFILE_LABELS.title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{APARTMENT_PROFILE_LABELS.harmonyLabel}</span>
          <span className={`text-lg font-bold ${getScoreColorClass(metrics.harmonyScore)}`}>
            {metrics.harmonyScore}%
          </span>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{residents.length}{APARTMENT_PROFILE_LABELS.residentsSuffix}</span>
          {' · '}
          {dominantSleepSchedule && getLabel(SLEEP_SCHEDULE_LABELS, dominantSleepSchedule)}
          {' · '}
          {dominantSocialStyle && getLabel(SOCIAL_STYLE_LABELS, dominantSocialStyle)}
          {hasNonSmokers && APARTMENT_PROFILE_LABELS.nonSmokers}
        </p>
      </div>

      {showDetails && (
        <>
          {/* Scale Metrics */}
          <div className="space-y-3 mb-4">
            <ScaleMetric
              label={APARTMENT_PROFILE_LABELS.fieldCleanliness}
              value={metrics.avgCleanliness}
              values={residents.map(r => ({ code: r.code, value: r.cleanlinessLevel }))}
              factorKey="cleanlinessLevel"
            />
            <ScaleMetric
              label={APARTMENT_PROFILE_LABELS.fieldNoiseTolerance}
              value={metrics.avgNoiseTolerance}
              values={residents.map(r => ({ code: r.code, value: r.noiseTolerance }))}
              factorKey="noiseTolerance"
            />
            <ScaleMetric
              label={APARTMENT_PROFILE_LABELS.fieldPrivacy}
              value={metrics.avgPrivacyNeed}
              values={residents.map(r => ({ code: r.code, value: r.privacyNeed }))}
              factorKey="privacyNeed"
            />
            <ScaleMetric
              label={APARTMENT_PROFILE_LABELS.fieldChores}
              value={metrics.avgChoresContribution}
              values={residents.map(r => ({ code: r.code, value: r.choresContribution }))}
              factorKey="choresContribution"
            />
          </div>

          {/* Categorical Distributions */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{APARTMENT_PROFILE_LABELS.sleepSection}</p>
              <div className="space-y-1">
                {Object.entries(metrics.sleepSchedules).map(([schedule, count]) => (
                  <div key={schedule} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{getLabel(SLEEP_SCHEDULE_LABELS, schedule)}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{APARTMENT_PROFILE_LABELS.socialSection}</p>
              <div className="space-y-1">
                {Object.entries(metrics.socialStyles).map(([style, count]) => (
                  <div key={style} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{getLabel(SOCIAL_STYLE_LABELS, style)}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Languages */}
          {metrics.languages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{APARTMENT_PROFILE_LABELS.languagesSection}</p>
              <div className="flex flex-wrap gap-1">
                {metrics.languages.map(({ code, count }) => (
                  <span
                    key={code}
                    className="px-2 py-0.5 bg-status-info/15 text-status-info-text text-xs rounded"
                  >
                    {getLabel(LANGUAGE_LABELS, code)} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Smoking Warning */}
          {!hasNonSmokers && (
            <div className="mt-4 p-2 bg-status-warning/10 border border-status-warning/25 rounded text-sm text-status-warning-text">
              ⚠️ {APARTMENT_PROFILE_LABELS.smokerWarning}{Object.entries(metrics.smokingStatuses)
                .filter(([k]) => k !== 'NON_SMOKER')
                .map(([k, v]) => `${v}x ${getLabel(SMOKING_STATUS_LABELS, k)}`)
                .join(', ')}
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface ScaleMetricProps {
  label: string
  value: number
  values: { code: string; value: number }[]
  factorKey: string
}

function ScaleMetric({ label, value, values, factorKey }: ScaleMetricProps) {
  const factor = RESIDENT_FACTORS[factorKey]
  const scaleFactor = factor?.type === 'scale' ? factor : null
  const roundedValue = Math.round(value * 10) / 10
  const percentage = ((value - 1) / 4) * 100 // Convert 1-5 to 0-100%

  // Find outliers (more than 1.5 away from average)
  const outliers = values.filter(v => Math.abs(v.value - value) > 1.5)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{roundedValue.toFixed(1)}</span>
          {outliers.length > 0 && (
            <span className="text-xs text-status-warning-text" title={`${APARTMENT_PROFILE_LABELS.deviationPrefix}${outliers.map(o => o.code).join(', ')}`}>
              ⚠️ {outliers.map(o => o.code).join(', ')}
            </span>
          )}
        </div>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* Average indicator */}
        <div
          className="absolute h-full bg-aoz-primary rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
        {/* Individual value markers */}
        {values.map((v, i) => {
          const pos = ((v.value - 1) / 4) * 100
          const isOutlier = Math.abs(v.value - value) > 1.5
          return (
            <div
              key={i}
              className={`absolute top-0 w-1 h-2 ${isOutlier ? 'bg-status-warning' : 'bg-aoz-primary-dark'} rounded-full`}
              style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
              title={`${v.code}: ${v.value}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-0.5">
        <span>{scaleFactor ? scaleFactor.lowLabel : '1'}</span>
        <span>{scaleFactor ? scaleFactor.highLabel : '5'}</span>
      </div>
    </div>
  )
}

export default ApartmentProfileCard
