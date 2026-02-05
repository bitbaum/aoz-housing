'use client'

import Link from 'next/link'
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LABELS,
  getLabel,
} from '@/lib/constants'
import { getScoreColorClass } from '@/lib/utils'

interface Resident {
  id: string
  code: string
  ageRange?: string
  languages?: string[]
  cleanlinessLevel: number
  noiseTolerance: number
  privacyNeed: number
  sleepSchedule: string
  socialStyle: string
  smokingStatus: string
}

interface CompatibilityScore {
  residentId: string
  comparedWithId: string
  overallScore: number
}

interface ProblemDetectionCardProps {
  residents: Resident[]
  compatibilityScores: CompatibilityScore[]
  housingUnitId: string
}

interface ResidentIssue {
  resident: Resident
  avgCompatibility: number
  issues: string[]
  severity: 'warning' | 'critical'
}

function detectProblems(
  residents: Resident[],
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
      const direction = resident.cleanlinessLevel < avgCleanliness ? 'niedrigere' : 'höhere'
      residentIssues.push(`Deutlich ${direction} Sauberkeit als Durchschnitt`)
    }

    if (Math.abs(resident.noiseTolerance - avgNoiseTolerance) > 1.5) {
      const direction = resident.noiseTolerance > avgNoiseTolerance ? 'höhere' : 'niedrigere'
      residentIssues.push(`Deutlich ${direction} Lärmtoleranz als Durchschnitt`)
    }

    if (Math.abs(resident.privacyNeed - avgPrivacyNeed) > 1.5) {
      const direction = resident.privacyNeed > avgPrivacyNeed ? 'höheres' : 'niedrigeres'
      residentIssues.push(`Deutlich ${direction} Bedürfnis nach Privatsphäre`)
    }

    // Check for categorical outliers
    if (dominantSleep && sleepCounts[resident.sleepSchedule] === 1 && residents.length > 2) {
      if (resident.sleepSchedule === 'NIGHT_OWL') {
        residentIssues.push('Einzige Nachteule unter Frühaufstehern/Normalen')
      } else if (resident.sleepSchedule === 'EARLY_BIRD') {
        residentIssues.push('Einziger Frühaufsteher unter Nachteulen/Normalen')
      }
    }

    if (dominantSocial && socialCounts[resident.socialStyle] === 1 && residents.length > 2) {
      if (resident.socialStyle === 'EXTROVERTED') {
        residentIssues.push('Einziger Extrovertierter unter Introvertierten/Moderaten')
      } else if (resident.socialStyle === 'INTROVERTED') {
        residentIssues.push('Einziger Introvertierter unter Extrovertierten/Moderaten')
      }
    }

    // Check for smoking mismatch
    if (resident.smokingStatus !== 'NON_SMOKER' && nonSmokerCount >= residents.length - 1) {
      residentIssues.push('Raucher in einer Nichtraucher-Wohnung')
    }

    // Only add if there are issues
    if (residentIssues.length > 0 || avgCompatibility < 70) {
      const severity = avgCompatibility < 50 || residentIssues.length >= 3 ? 'critical' : 'warning'

      // Add low compatibility as an issue if applicable
      if (avgCompatibility < 70) {
        residentIssues.unshift(`Durchschnittliche Kompatibilität nur ${avgCompatibility}%`)
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
            <h2 className="text-lg font-semibold text-green-800">Keine Probleme erkannt</h2>
            <p className="text-sm text-green-600">
              Alle Bewohner passen gut zusammen. Harmonie in der Wohnung.
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
          <h2 className="text-lg font-semibold text-gray-900">Probleme erkannt</h2>
        </div>
        <span className="text-sm text-gray-500">
          {problems.length} {problems.length === 1 ? 'Bewohner' : 'Bewohner'} mit Anpassungsproblemen
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
          💡 <strong>Tipp:</strong> Bewohner mit Anpassungsproblemen könnten in einer anderen Wohnung
          besser passen. Nutzen Sie &quot;Umplatzieren&quot;, um passende Alternativen zu finden.
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
                <> · {resident.languages.slice(0, 2).map(l => getLabel(LANGUAGE_LABELS, l)).join(', ')}</>
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
            Umplatzieren
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
