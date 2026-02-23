import Link from 'next/link'
import { getScoreBgClass } from '@/lib/utils'

interface Assessment {
  id: string
  comparedWithId: string
  comparedWith: { code: string }
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Top Kompatibilitäten
      </h2>
      <div className="space-y-3">
        {assessments.map((assessment) => (
          <div
            key={assessment.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                {assessment.comparedWith.code.slice(0, 2).toUpperCase()}
              </div>
              <Link
                href={`/residents/${assessment.comparedWithId}`}
                className="font-medium text-gray-900 hover:text-aoz-primary"
              >
                {assessment.comparedWith.code}
              </Link>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgClass(
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
