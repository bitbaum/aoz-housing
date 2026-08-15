import Link from 'next/link'
import { getScoreBgClass } from '@/lib/utils'
import { TOP_COMPATIBILITIES_LABELS } from '@/lib/constants'
import { residentInitials, residentName } from '@/lib/utils/resident-name'

interface Assessment {
  id: string
  comparedWithId: string
  comparedWith: { code: string; displayName: string | null }
  overallScore: number
}

interface TopCompatibilitiesCardProps {
  assessments: Assessment[]
}

export function TopCompatibilitiesCard({ assessments }: TopCompatibilitiesCardProps) {
  if (assessments.length === 0) {
    return null
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-ui-text mb-4">
        {TOP_COMPATIBILITIES_LABELS.title}
      </h2>
      <div className="space-y-3">
        {assessments.map((assessment) => (
          <div
            key={assessment.id}
            className="flex items-center justify-between p-3 bg-ui-subtle rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="avatar-sm">
                {residentInitials(assessment.comparedWith)}
              </div>
              <Link
                href={`/residents/${assessment.comparedWithId}`}
                className="inline-flex items-center py-2 -my-2 font-medium text-ui-text hover:text-brand-primary"
              >
                {residentName(assessment.comparedWith)}
              </Link>
            </div>
            <div
              className={`px-3 py-1 rounded-sm text-sm font-medium ${getScoreBgClass(
                assessment.overallScore
              )}`}
            >
              {Math.round(assessment.overallScore)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
