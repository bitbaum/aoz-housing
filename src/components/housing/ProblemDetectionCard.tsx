'use client'

import Link from 'next/link'
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  PROBLEM_DETECTION_LABELS,
  getLabel,
} from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import type { ResidentSummary } from '@/lib/types'

interface CompatibilityScore {
  residentId: string
  comparedWithId: string
  overallScore: number
}

interface ProblemDetectionCardProps {
  residents: ResidentSummary[]
  compatibilityScores: CompatibilityScore[]
  housingUnitId: string
}

interface ResidentIssue {
  resident: ResidentSummary
  avgCompatibility: number
  issues: string[]
  severity: 'warning' | 'critical'
}

function detectProblems(
  residents: ResidentSummary[],
  scores: CompatibilityScore[]
): ResidentIssue[] {
  if (residents.length < 2) return []

  const issues: ResidentIssue[] = []

  // Calculate average values for the apartment
  const avgCleanliness = residents.reduce((s, r) => s + r.cleanlinessLevel, 0) / residents.length
  const avgNoiseTolerance = residents.reduce((s, r) => s + r.noiseTolerance, 0) / residents.length
  const avgPrivacyNeed = residents.reduce((s, r) => s + r.privacyNeed, 0) / residents.length

  // Count sleep schedules and social styles
  const sleepCounts: Record<string, number> = {}
  const socialCounts: Record<string, number> = {}
  const smokingCounts: Record<string, number> = {}

  for (const r of residents) {
    sleepCounts[r.sleepSchedule] = (sleepCounts[r.sleepSchedule] || 0) + 1
    socialCounts[r.socialStyle] = (socialCounts[r.socialStyle] || 0) + 1
    smokingCounts[r.smokingStatus] = (smokingCounts[r.smokingStatus] || 0) + 1
  }

  // Find dominant patterns
  const dominantSleep = Object.entries(sleepCounts).sort((a, b) => b[1] - a[1])[0]
  const dominantSocial = Object.entries(socialCounts).sort((a, b) => b[1] - a[1])[0]
  const nonSmokerCount = smokingCounts['NON_SMOKER'] || 0

  for (const resident of residents) {
    const residentIssues: string[] = []

    // Calculate average compatibility with others
    const relevantScores = scores.filter(
      s => s.residentId === resident.id || s.comparedWithId === resident.id
    )
    const avgCompatibility = relevantScores.length > 0
      ? Math.round(relevantScores.reduce((s, sc) => s + sc.overallScore, 0) / relevantScores.length)
      : 100

    // Check for scale outliers (more than 1.5 away from average)
    if (Math.abs(resident.cleanlinessLevel - avgCleanliness) > 1.5) {
      const direction = resident.cleanlinessLevel < avgCleanliness ? PROBLEM_DETECTION_LABELS.lowerCleanliness : PROBLEM_DETECTION_LABELS.higherCleanliness
      residentIssues.push(`Deutlich ${direction} Sauberkeit als Durchschnitt`)
    }

    if (Math.abs(resident.noiseTolerance - avgNoiseTolerance) > 1.5) {
      const direction = resident.noiseTolerance > avgNoiseTolerance ? PROBLEM_DETECTION_LABELS.higherNoiseTolerance : PROBLEM_DETECTION_LABELS.lowerNoiseTolerance
      residentIssues.push(`Deutlich ${direction} Lärmtoleranz als Durchschnitt`)
    }

    if (Math.abs(resident.privacyNeed - avgPrivacyNeed) > 1.5) {
      const direction = resident.privacyNeed > avgPrivacyNeed ? PROBLEM_DETECTION_LABELS.higherPrivacy : PROBLEM_DETECTION_LABELS.lowerPrivacy
      residentIssues.push(`Deutlich ${direction} Bedürfnis nach Privatsphäre`)
    }

    // Check for categorical outliers
    if (dominantSleep && sleepCounts[resident.sleepSchedule] === 1 && residents.length > 2) {
      if (resident.sleepSchedule === 'NIGHT_OWL') {
        residentIssues.push(PROBLEM_DETECTION_LABELS.onlyNightOwl)
      } else if (resident.sleepSchedule === 'EARLY_BIRD') {
        residentIssues.push(PROBLEM_DETECTION_LABELS.onlyEarlyBird)
      }
    }

    if (dominantSocial && socialCounts[resident.socialStyle] === 1 && residents.length > 2) {
      if (resident.socialStyle === 'EXTROVERTED') {
        residentIssues.push(PROBLEM_DETECTION_LABELS.onlyExtrovert)
      } else if (resident.socialStyle === 'INTROVERTED') {
        residentIssues.push(PROBLEM_DETECTION_LABELS.onlyIntrovert)
      }
    }

    // Check for smoking mismatch
    if (resident.smokingStatus !== 'NON_SMOKER' && nonSmokerCount >= residents.length - 1) {
      residentIssues.push(PROBLEM_DETECTION_LABELS.smokerInNonSmoking)
    }

    // Only add if there are issues
    if (residentIssues.length > 0 || avgCompatibility < 70) {
      const severity = avgCompatibility < 50 || residentIssues.length >= 3 ? 'critical' : 'warning'

      // Add low compatibility as an issue if applicable
      if (avgCompatibility < 70) {
        residentIssues.unshift(`${PROBLEM_DETECTION_LABELS.avgCompatibilityOnly} ${avgCompatibility}%`)
      }

      issues.push({
        resident,
        avgCompatibility,
        issues: residentIssues,
        severity,
      })
    }
  }

  // Sort by severity and compatibility
  return issues.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1
    }
    return a.avgCompatibility - b.avgCompatibility
  })
}

export function ProblemDetectionCard({
  residents,
  compatibilityScores,
  housingUnitId,
}: ProblemDetectionCardProps) {
  const problems = detectProblems(residents, compatibilityScores)

  if (problems.length === 0) {
    return (
      <div className="card border-green-200 bg-green-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <h2 className="text-lg font-semibold text-green-800">{PROBLEM_DETECTION_LABELS.noProblems}</h2>
            <p className="text-sm text-green-600">
              {PROBLEM_DETECTION_LABELS.noProblemsDesc}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <h2 className="text-lg font-semibold text-gray-900">{PROBLEM_DETECTION_LABELS.problemsDetected}</h2>
        </div>
        <span className="text-sm text-gray-500">
          {problems.length} {problems.length === 1 ? 'Bewohner' : 'Bewohner'} {PROBLEM_DETECTION_LABELS.adaptationIssues}
        </span>
      </div>

      <div className="space-y-4">
        {problems.map((problem) => (
          <ProblemResidentRow
            key={problem.resident.id}
            problem={problem}
            housingUnitId={housingUnitId}
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          💡 <strong>{PROBLEM_DETECTION_LABELS.tip}</strong> {PROBLEM_DETECTION_LABELS.tipMessage}
        </p>
      </div>
    </div>
  )
}

interface ProblemResidentRowProps {
  problem: ResidentIssue
  housingUnitId: string
}

function ProblemResidentRow({ problem, housingUnitId }: ProblemResidentRowProps) {
  const { resident, avgCompatibility, issues, severity } = problem

  const borderColor = severity === 'critical' ? 'border-red-200' : 'border-orange-200'
  const bgColor = severity === 'critical' ? 'bg-red-50' : 'bg-orange-50'
  const iconColor = severity === 'critical' ? 'text-red-500' : 'text-orange-500'

  return (
    <div className={`p-4 rounded-lg border ${borderColor} ${bgColor}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: Resident info */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-aoz-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
            {resident.code.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/residents/${resident.id}`}
                className="font-medium text-gray-900 hover:text-aoz-primary"
              >
                {resident.code}
              </Link>
              <span className={`text-sm font-medium ${getScoreColorClass(avgCompatibility)}`}>
                Ø {avgCompatibility}%
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {resident.ageRange && getLabel(AGE_RANGE_LABELS, resident.ageRange)}
              {resident.languages && resident.languages.length > 0 && (
                <> · {resident.languages.slice(0, DISPLAY_LIMITS.languagePreview).map((l: string) => getLabel(LANGUAGE_LABELS, l)).join(', ')}</>
              )}
            </p>

            {/* Issues list */}
            <ul className="mt-2 space-y-1">
              {issues.map((issue, i) => (
                <li key={i} className={`text-sm ${iconColor} flex items-start gap-1`}>
                  <span className="flex-shrink-0">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Action button */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Link
            href={`/matching?resident=${resident.id}&transfer=1`}
            className={`btn-primary text-sm px-3 py-1.5 whitespace-nowrap ${
              severity === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {PROBLEM_DETECTION_LABELS.relocate}
          </Link>
          <Link
            href={`/residents/${resident.id}`}
            className="text-sm text-center text-gray-500 hover:text-gray-700"
          >
            Profil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProblemDetectionCard
