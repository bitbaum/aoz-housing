'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { getScoreBgClass } from '@/lib/utils'
import { COMPATIBILITY_MATRIX_LABELS } from '@/lib/constants'
import type { ResidentBasic } from '@/lib/types'
import { CompatibilityDetailPopover, type CompatibilityScore } from './CompatibilityDetailPopover'

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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
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
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
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
      {/* Desktop: click-to-detail hint */}
      <p className="hidden sm:block text-sm text-ui-muted mb-4">{COMPATIBILITY_MATRIX_LABELS.clickHint}</p>
      {/* Mobile: scroll hint */}
      <div className="sm:hidden text-xs text-ui-muted mb-2 flex items-center gap-1" aria-hidden="true">
        <span>←</span>
        <span>{COMPATIBILITY_MATRIX_LABELS.swipeHint}</span>
        <span>→</span>
      </div>
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th scope="col" className="p-2"></th>
            {residents.map((r) => (
              <th scope="col" key={r.id} className="p-2 text-center font-medium text-ui-muted">
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
              <th scope="row" className="p-2 font-medium text-ui-muted text-left">
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
                      <span className="text-ui-muted" aria-hidden="true">-</span>
                    ) : score === null ? (
                      <button
                        onClick={(e) => handleCellClick(r1, r2, e)}
                        className="inline-flex items-center justify-center w-12 min-h-[44px] rounded bg-ui-subtle text-ui-muted text-xs hover:bg-ui-border transition-colors cursor-pointer"
                        aria-label={`Keine Bewertung: ${r1.code} und ${r2.code}`}
                      >
                        ?
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleCellClick(r1, r2, e)}
                        className={`inline-flex items-center justify-center w-12 min-h-[44px] rounded ${getScoreBgClass(
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
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ui-muted">
        <span className="font-medium">{COMPATIBILITY_MATRIX_LABELS.legend}</span>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-score-excellent/15"></span>
          <span>{COMPATIBILITY_MATRIX_LABELS.legendExcellent}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-score-good/15"></span>
          <span>{COMPATIBILITY_MATRIX_LABELS.legendGood}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-score-medium/15"></span>
          <span>{COMPATIBILITY_MATRIX_LABELS.legendMedium}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-score-low/15"></span>
          <span>{COMPATIBILITY_MATRIX_LABELS.legendLow}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-score-critical/15"></span>
          <span>{COMPATIBILITY_MATRIX_LABELS.legendCritical}</span>
        </div>
      </div>
    </div>
  )
}

export default CompatibilityMatrixInteractive
