'use client'

import {
  RESIDENT_DIMENSIONS,
  RESIDENT_FACTORS,
} from '@/lib/config/resident-factors'
import {
  RESEARCH_SOURCES,
  EVIDENCE_STRENGTH_CONFIG,
  type EvidenceStrength,
} from '@/lib/config/algorithm-docs'

// =============================================================================
// Derived Constants from Config (SSOT)
// =============================================================================

export const FACTOR_COUNT = Object.values(RESIDENT_FACTORS).filter(f => f.weight > 0).length
export const DIMENSION_COUNT = RESIDENT_DIMENSIONS.length
export const SOURCE_COUNT = RESEARCH_SOURCES.length

// =============================================================================
// Utility Functions
// =============================================================================

export function getFactorsByDimension(dimensionId: string) {
  return Object.values(RESIDENT_FACTORS)
    .filter(f => f.dimension === dimensionId && f.weight > 0)
    .sort((a, b) => b.weight - a.weight)
}

export function getDimensionRationale(
  dimensionId: string,
  factorCount: number,
  strongEvidenceCount: number
): string {
  const rationales: Record<string, string> = {
    lifestyle:
      'Höchstes Gewicht: Schlafrhythmus und Sauberkeit haben die stärkste experimentelle Evidenz als Konfliktauslöser (RCT-Studien, n=3\'098). v2.0: erhöht von 30% auf 35%.',
    social:
      'Kommunikation (Sprache) und Privatsphäre sind durch BFH-HSLU 2024 (1\'000 Familien) als "kritisch" bestätigt. Stabile Gewichtung bei 25%.',
    practical:
      'Rauchen ist nicht-verhandelbar (Gesundheitsrecht), andere Faktoren haben geringere Konfliktevidenz. v2.0: reduziert von 25% auf 20%.',
    requirements:
      'Binäre Anforderungen (Rollstuhl, Einzelzimmer) – kein Kompromiss möglich. Blockieren statt gewichten.',
  }
  return (
    rationales[dimensionId] ||
    `${factorCount} Faktoren, davon ${strongEvidenceCount} mit starker Evidenz.`
  )
}

export function formatDate(isoDate: string): string {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${day}. ${months[month - 1]} ${year}`
}

// =============================================================================
// Shared Components
// =============================================================================

export function EvidenceStrengthBadge({ strength }: { strength: EvidenceStrength }) {
  const config = EVIDENCE_STRENGTH_CONFIG[strength]
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClasses[config.color]}`}>
      {config.label}
    </span>
  )
}

export function EvidenceStrengthBar({ strength }: { strength: EvidenceStrength }) {
  const barWidths: Record<EvidenceStrength, string> = {
    strong: 'w-full',
    moderate: 'w-2/3',
    preliminary: 'w-1/3',
  }
  const barColors: Record<EvidenceStrength, string> = {
    strong: 'bg-green-500',
    moderate: 'bg-yellow-500',
    preliminary: 'bg-gray-400',
  }
  return (
    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${barColors[strength]} ${barWidths[strength]}`} />
    </div>
  )
}

export function FactStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      <div className="flex items-center gap-2 text-white/70 mb-1">{icon}</div>
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  )
}

export function ProcessStep({
  number,
  title,
  description,
  icon,
}: {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-aoz-primary/10 text-aoz-primary mb-4">
        {icon}
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-aoz-primary text-white text-sm flex items-center justify-center font-medium">
          {number}
        </span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

export function DimensionCard({
  name,
  weight,
  color,
  description,
  factorCount,
}: {
  name: string
  weight: number
  color: 'purple' | 'blue' | 'green' | 'orange'
  description: string
  factorCount: number
}) {
  const colorClasses = {
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold">{weight}%</span>
        <span className="text-xs opacity-70">{factorCount} Faktoren</span>
      </div>
      <h3 className="font-semibold mb-1">{name}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  )
}

export function ScoreLevel({
  score,
  label,
  color,
  action,
}: {
  score: string
  label: string
  color: 'green' | 'emerald' | 'yellow' | 'orange' | 'red'
  action: string
}) {
  const colorClasses = {
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  }

  const bgClasses = {
    green: 'bg-green-50 border-green-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200',
  }

  return (
    <div className={`rounded-lg border p-3 text-center ${bgClasses[color]}`}>
      <div className={`w-full h-2 rounded-full ${colorClasses[color]} mb-2`} />
      <div className="font-bold text-gray-900">{score}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-xs text-gray-500 mt-1">{action}</div>
    </div>
  )
}
