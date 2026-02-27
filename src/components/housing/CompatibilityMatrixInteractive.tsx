'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { getScoreBgClass, getScoreColorClass, getScoreLabel } from '@/lib/utils'
import { COMPATIBILITY_SCORE_LABELS } from '@/lib/constants'
import { SCORE_BG_COLORS, getScoreLevel } from '@/lib/config/thresholds'
import type { ResidentBasic } from '@/lib/types'

interface CompatibilityScore {
  id: string
  residentId: string
  comparedWithId: string
  overallScore: number
  lifestyleScore?: number
  socialScore?: number
  practicalScore?: number
  riskScore?: number
  conflicts?: { message: string; severity: string }[]
  strengths?: string[]
}

interface CompatibilityMatrixInteractiveProps {
  residents: ResidentBasic[]
  scores: CompatibilityScore[]
}

interface SelectedCell {
  resident1: ResidentBasic
  resident2: ResidentBasic
  score: CompatibilityScore | null
  position: { x: number; y: number }
}

export function CompatibilityMatrixInteractive({
  residents,
  scores,
}: CompatibilityMatrixInteractiveProps) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelectedCell(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedCell(null)
      }
    }

    if (selectedCell) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [selectedCell])

  const getScore = (r1: string, r2: string): CompatibilityScore | null => {
    if (r1 === r2) return null
    return scores.find(
      (s) =>
        (s.residentId === r1 && s.comparedWithId === r2) ||
        (s.residentId === r2 && s.comparedWithId === r1)
    ) || null
  }

  const handleCellClick = (
    r1: ResidentBasic,
    r2: ResidentBasic,
    event: React.MouseEvent
  ) => {
    if (r1.id === r2.id) return

    const score = getScore(r1.id, r2.id)
    const rect = (event.target as HTMLElement).getBoundingClientRect()

    setSelectedCell({
      resident1: r1,
      resident2: r2,
      score,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      },
    })
  }

  return (
    <div className="relative">
      {/* Mobile scroll hint */}
      <div className="sm:hidden text-xs text-gray-500 mb-2 flex items-center gap-1" aria-hidden="true">
        <span>←</span>
        <span>Wischen zum Scrollen</span>
        <span>→</span>
      </div>
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th scope="col" className="p-2"></th>
            {residents.map((r) => (
              <th scope="col" key={r.id} className="p-2 text-center font-medium text-gray-700">
                <Link
                  href={`/residents/${r.id}`}
                  className="hover:text-aoz-primary transition-colors"
                >
                  {r.code}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {residents.map((r1) => (
            <tr key={r1.id}>
              <th scope="row" className="p-2 font-medium text-gray-700 text-left">
                <Link
                  href={`/residents/${r1.id}`}
                  className="hover:text-aoz-primary transition-colors"
                >
                  {r1.code}
                </Link>
              </th>
              {residents.map((r2) => {
                const score = getScore(r1.id, r2.id)
                const isSelected =
                  selectedCell &&
                  ((selectedCell.resident1.id === r1.id && selectedCell.resident2.id === r2.id) ||
                    (selectedCell.resident1.id === r2.id && selectedCell.resident2.id === r1.id))

                return (
                  <td key={r2.id} className="p-2 text-center">
                    {r1.id === r2.id ? (
                      <span className="text-gray-400" aria-hidden="true">-</span>
                    ) : score === null ? (
                      <button
                        onClick={(e) => handleCellClick(r1, r2, e)}
                        className="inline-flex items-center justify-center w-12 h-8 rounded bg-gray-100 text-gray-500 text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                        aria-label={`Keine Bewertung: ${r1.code} und ${r2.code}`}
                      >
                        ?
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleCellClick(r1, r2, e)}
                        className={`inline-flex items-center justify-center w-12 h-8 rounded ${getScoreBgClass(
                          score.overallScore
                        )} text-xs font-medium transition-all cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-aoz-primary ${
                          isSelected ? 'ring-2 ring-offset-1 ring-aoz-primary' : ''
                        }`}
                        aria-label={`Kompatibilität ${r1.code} und ${r2.code}: ${score.overallScore}%`}
                        aria-expanded={isSelected ? true : undefined}
                      >
                        {score.overallScore}
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      </div>
      {/* Detail Popover */}
      {selectedCell && (
        <CompatibilityDetailPopover
          ref={popoverRef}
          resident1={selectedCell.resident1}
          resident2={selectedCell.resident2}
          score={selectedCell.score}
          position={selectedCell.position}
          onClose={() => setSelectedCell(null)}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="font-medium">Legende:</span>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-100"></span>
          <span>80+ Sehr gut</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-emerald-100"></span>
          <span>60-79 Gut</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-100"></span>
          <span>40-59 Mittel</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-orange-100"></span>
          <span>20-39 Niedrig</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-100"></span>
          <span>0-19 Kritisch</span>
        </div>
      </div>
    </div>
  )
}

interface CompatibilityDetailPopoverProps {
  resident1: ResidentBasic
  resident2: ResidentBasic
  score: CompatibilityScore | null
  position: { x: number; y: number }
  onClose: () => void
}

const CompatibilityDetailPopover = ({
  resident1,
  resident2,
  score,
  position,
  onClose,
}: CompatibilityDetailPopoverProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Adjust position to stay within viewport
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 8

      if (rect.right > viewportWidth) {
        popoverRef.current.style.left = `${viewportWidth - rect.width - padding}px`
      }
      if (rect.left < 0) {
        popoverRef.current.style.left = `${padding}px`
      }
      if (rect.bottom > viewportHeight) {
        popoverRef.current.style.top = `${position.y - rect.height - 60}px`
      }
    }
  }, [position])

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Kompatibilität: ${resident1.code} und ${resident2.code}`}
      className="fixed z-50 w-[calc(100vw-16px)] sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{
        left: Math.max(8, position.x - 160),
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
              {resident1.code.slice(0, 2)}
            </div>
            <span className="text-gray-400">↔</span>
            <div className="w-8 h-8 bg-aoz-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
              {resident2.code.slice(0, 2)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Schliessen"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {score ? (
          <>
            {/* Overall Score */}
            <div className="text-center mb-4">
              <span
                className={`text-3xl font-bold ${getScoreColorClass(score.overallScore)}`}
              >
                {score.overallScore}%
              </span>
              <p className="text-sm text-gray-500 mt-1">
                {getScoreLabel(score.overallScore)} Kompatibilität
              </p>
            </div>

            {/* Dimension Scores */}
            <div className="space-y-2 mb-4">
              {score.lifestyleScore !== undefined && (
                <ScoreDimension
                  label="Lebensstil"
                  score={score.lifestyleScore}
                  description="Schlaf, Lärm, Sauberkeit"
                />
              )}
              {score.socialScore !== undefined && (
                <ScoreDimension
                  label="Sozial"
                  score={score.socialScore}
                  description="Sprache, Umgang"
                />
              )}
              {score.practicalScore !== undefined && (
                <ScoreDimension
                  label="Praktisch"
                  score={score.practicalScore}
                  description="Rauchen, Küche"
                />
              )}
              {score.riskScore !== undefined && (
                <ScoreDimension
                  label="Risiko"
                  score={score.riskScore}
                  description="Konfliktpotenzial"
                />
              )}
            </div>

            {/* Strengths */}
            {score.strengths && score.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Stärken</p>
                <ul className="space-y-1">
                  {score.strengths.slice(0, 2).map((s, i) => (
                    <li key={i} className="text-sm text-green-600 flex items-start gap-1">
                      <span>✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conflicts */}
            {score.conflicts && score.conflicts.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Bedenken</p>
                <ul className="space-y-1">
                  {score.conflicts.slice(0, 2).map((c, i) => (
                    <li
                      key={i}
                      className={`text-sm flex items-start gap-1 ${
                        c.severity === 'BLOCKING'
                          ? 'text-red-600'
                          : c.severity === 'HIGH'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      <span>⚠</span>
                      <span>{c.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-2">Keine Bewertung vorhanden</p>
            <p className="text-xs text-gray-500">
              Die Kompatibilität wurde noch nicht berechnet
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg flex gap-2">
        <Link
          href={`/residents/${resident1.id}`}
          className="flex-1 text-center text-sm text-aoz-primary hover:underline"
        >
          {resident1.code}
        </Link>
        <span className="text-gray-400">|</span>
        <Link
          href={`/residents/${resident2.id}`}
          className="flex-1 text-center text-sm text-aoz-primary hover:underline"
        >
          {resident2.code}
        </Link>
      </div>
    </div>
  )
}

function ScoreDimension({
  label,
  score,
  description,
}: {
  label: string
  score: number
  description: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <p className="text-[10px] text-gray-500">{description}</p>
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${SCORE_BG_COLORS[getScoreLevel(score)]}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium w-8 text-right">{score}</span>
    </div>
  )
}

export default CompatibilityMatrixInteractive
