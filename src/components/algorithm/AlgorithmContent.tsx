'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Brain,
  Shield,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  MapPin,
} from 'lucide-react'
import { Tabs } from '@/components/ui'
import {
  FACTOR_COUNT,
  DIMENSION_COUNT,
  SOURCE_COUNT,
  FactStat,
} from './shared'
import { OverviewTab } from './OverviewTab'
import { ScienceTab } from './ScienceTab'
import { DimensionsTab } from './DimensionsTab'
import { DataCollectionTab } from './DataCollectionTab'
import { TechnicalTab } from './TechnicalTab'
import { ALGORITHM_OVERVIEW_LABELS } from '@/lib/constants/labels'

export function AlgorithmContent() {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null)

  const tabs = [
    { id: 'overview', label: ALGORITHM_OVERVIEW_LABELS.tabOverview },
    { id: 'science', label: ALGORITHM_OVERVIEW_LABELS.tabScience },
    { id: 'dimensions', label: ALGORITHM_OVERVIEW_LABELS.tabFactors },
    { id: 'collection', label: ALGORITHM_OVERVIEW_LABELS.tabCollection },
    { id: 'technical', label: ALGORITHM_OVERVIEW_LABELS.tabTechnical },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-aoz-primary via-aoz-primary to-emerald-600 text-white p-8 md:p-12 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-8 h-8" />
            </div>
            <span className="text-white/80 text-sm font-medium">{ALGORITHM_OVERVIEW_LABELS.heroSubtitle}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {ALGORITHM_OVERVIEW_LABELS.heroTitle}
          </h1>

          <p className="text-lg text-white/90 mb-8 max-w-2xl">
            {ALGORITHM_OVERVIEW_LABELS.heroDesc(FACTOR_COUNT, DIMENSION_COUNT)}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <FactStat
              icon={<Layers className="w-5 h-5" />}
              value={String(DIMENSION_COUNT)}
              label={ALGORITHM_OVERVIEW_LABELS.tabDimensions}
            />
            <FactStat
              icon={<Activity className="w-5 h-5" />}
              value={String(FACTOR_COUNT)}
              label={ALGORITHM_OVERVIEW_LABELS.tabFactors}
            />
            <FactStat
              icon={<MapPin className="w-5 h-5" />}
              value="CH/DE/INT"
              label={ALGORITHM_OVERVIEW_LABELS.sourcesLabel(SOURCE_COUNT)}
            />
            <FactStat
              icon={<Shield className="w-5 h-5" />}
              value={ALGORITHM_OVERVIEW_LABELS.ethicsValue}
              label={ALGORITHM_OVERVIEW_LABELS.ethicsLabel}
            />
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'science' && <ScienceTab />}
      {activeTab === 'dimensions' && (
        <DimensionsTab
          expandedDimension={expandedDimension}
          setExpandedDimension={setExpandedDimension}
        />
      )}
      {activeTab === 'collection' && <DataCollectionTab />}
      {activeTab === 'technical' && <TechnicalTab />}

      {/* CTA Section */}
      <section className="mt-12 text-center py-12 px-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
        <Sparkles className="w-10 h-10 text-aoz-primary mx-auto mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          Bereit für bessere Platzierungen?
        </h2>
        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
          Starten Sie das Matching und finden Sie die optimale Wohnkonstellation.
        </p>
        <Link
          href="/matching"
          className="inline-flex items-center gap-2 px-6 py-3 bg-aoz-primary text-white rounded-lg font-medium hover:bg-aoz-primary/90 transition-colors"
        >
          Matching starten
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
