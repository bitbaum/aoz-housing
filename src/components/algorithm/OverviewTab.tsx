'use client'

import {
  Brain,
  Users,
  Target,
  Scale,
  BookOpen,
  Layers,
  Beaker,
} from 'lucide-react'
import { RESIDENT_DIMENSIONS } from '@/lib/config/resident-factors'
import {
  FACTOR_COUNT,
  DIMENSION_COUNT,
  getFactorsByDimension,
  ProcessStep,
  DimensionCard,
  ScoreLevel,
} from './shared'
import { COMPATIBILITY_SCORE_LABELS, SCORE_LEVEL_ACTION_LABELS } from '@/lib/constants/labels/scores'
import { ALGORITHM_OVERVIEW_LABELS } from '@/lib/constants/labels'

export function OverviewTab() {
  const dimensionColors = ['purple', 'blue', 'green', 'orange'] as const

  return (
    <div className="space-y-8">
      {/* How it Works */}
      <section className="card">
        <h2 className="text-xl font-semibold text-ui-text mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-aoz-primary" />
          {ALGORITHM_OVERVIEW_LABELS.howItWorksTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <ProcessStep
            number={1}
            title={ALGORITHM_OVERVIEW_LABELS.processStep1Title}
            description={ALGORITHM_OVERVIEW_LABELS.processStep1Desc}
            icon={<Users className="w-6 h-6" />}
          />
          <ProcessStep
            number={2}
            title={ALGORITHM_OVERVIEW_LABELS.processStep2Title}
            description={ALGORITHM_OVERVIEW_LABELS.processStep2Desc(FACTOR_COUNT)}
            icon={<Brain className="w-6 h-6" />}
          />
          <ProcessStep
            number={3}
            title={ALGORITHM_OVERVIEW_LABELS.processStep3Title}
            description={ALGORITHM_OVERVIEW_LABELS.processStep3Desc}
            icon={<Scale className="w-6 h-6" />}
          />
        </div>
      </section>

      {/* Scientific Methodology Summary */}
      <section className="card">
        <h2 className="text-xl font-semibold text-ui-text mb-4 flex items-center gap-2">
          <Beaker className="w-5 h-5 text-aoz-primary" />
          {ALGORITHM_OVERVIEW_LABELS.scienceMethodTitle}
        </h2>
        <div className="text-ui-muted space-y-2">
          <p>{ALGORITHM_OVERVIEW_LABELS.scienceMethodP1}</p>
          <p>{ALGORITHM_OVERVIEW_LABELS.scienceMethodP2}</p>
        </div>
      </section>

      {/* Dimensions with Visual Weight Bars */}
      <section className="card">
        <h2 className="text-xl font-semibold text-ui-text mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-aoz-primary" />
          {ALGORITHM_OVERVIEW_LABELS.dimensionsSectionTitle(DIMENSION_COUNT)}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {RESIDENT_DIMENSIONS.map((dim, i) => {
            const factors = getFactorsByDimension(dim.id)
            return (
              <DimensionCard
                key={dim.id}
                name={dim.label}
                weight={Math.round(dim.weight * 100)}
                color={dimensionColors[i % dimensionColors.length]}
                description={dim.description}
                factorCount={factors.length}
              />
            )
          })}
        </div>

        {/* CSS-only weight visualization bars */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-ui-muted uppercase tracking-wide">
            {ALGORITHM_OVERVIEW_LABELS.weightDistribution}
          </h3>
          {RESIDENT_DIMENSIONS.map((dim, i) => {
            const pct = Math.round(dim.weight * 100)
            const barColors = [
              'bg-aoz-secondary',
              'bg-status-info',
              'bg-status-success',
              'bg-status-warning',
            ]
            return (
              <div key={dim.id} className="flex items-center gap-3">
                <span className="text-sm text-ui-muted w-28 flex-shrink-0">{dim.label}</span>
                <div className="flex-1 h-5 bg-ui-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-ui-muted w-10 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Score Scale */}
      <section className="card">
        <h2 className="text-xl font-semibold text-ui-text mb-6 flex items-center gap-2">
          <Scale className="w-5 h-5 text-aoz-primary" />
          {ALGORITHM_OVERVIEW_LABELS.scoreInterpTitle}
        </h2>

        <p className="text-ui-muted mb-6">
          {ALGORITHM_OVERVIEW_LABELS.scoreInterpDesc}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <ScoreLevel score="80-100" label={COMPATIBILITY_SCORE_LABELS.excellent} color="green" action={SCORE_LEVEL_ACTION_LABELS.excellent} />
          <ScoreLevel score="60-79" label={COMPATIBILITY_SCORE_LABELS.good} color="emerald" action={SCORE_LEVEL_ACTION_LABELS.good} />
          <ScoreLevel score="40-59" label={COMPATIBILITY_SCORE_LABELS.moderate} color="yellow" action={SCORE_LEVEL_ACTION_LABELS.moderate} />
          <ScoreLevel score="20-39" label={COMPATIBILITY_SCORE_LABELS.low} color="orange" action={SCORE_LEVEL_ACTION_LABELS.low} />
          <ScoreLevel score="0-19" label={COMPATIBILITY_SCORE_LABELS.critical} color="red" action={SCORE_LEVEL_ACTION_LABELS.critical} />
        </div>
      </section>

      {/* Version Footer */}
      <div className="text-center text-sm text-ui-muted pt-4">
        {ALGORITHM_OVERVIEW_LABELS.lastUpdated}
      </div>
    </div>
  )
}
