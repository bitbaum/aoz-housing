'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brain, Shield, ArrowRight, Sparkles, Layers, Activity, MapPin } from 'lucide-react'
import { Tabs, TabPanel } from '@/components/ui'
import { FACTOR_COUNT, DIMENSION_COUNT, SOURCE_COUNT, FactStat } from './shared'
import { OverviewTab } from './OverviewTab'
import { ScienceTab } from './ScienceTab'
import { DimensionsTab } from './DimensionsTab'
import { DataCollectionTab } from './DataCollectionTab'
import { TechnicalTab } from './TechnicalTab'
import { ALGORITHM_OVERVIEW_LABELS } from '@/lib/constants'

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
      <section className="relative overflow-hidden rounded-lg bg-ui-text text-ui-inverse p-8 md:p-12 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-ui-inverse/10 rounded-lg">
              <Brain className="w-8 h-8" />
            </div>
            <span className="text-ui-inverse/80 text-sm font-medium">
              {ALGORITHM_OVERVIEW_LABELS.heroSubtitle}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {ALGORITHM_OVERVIEW_LABELS.heroTitle}
          </h1>

          <p className="text-lg text-ui-inverse/90 mb-8 max-w-2xl">
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

      {/* Tab Content — each tab button points aria-controls at `tabpanel-<id>`,
          so the visible panel must actually carry that id. Rendering the
          content bare left every aria-controls dangling (axe
          `aria-valid-attr-value`, critical). */}
      <TabPanel id={activeTab}>
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
      </TabPanel>

      {/* CTA Section */}
      <section className="mt-12 text-center py-12 px-6 bg-ui-subtle rounded-lg">
        <Sparkles className="w-10 h-10 text-brand-primary mx-auto mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-ui-text mb-3">
          {ALGORITHM_OVERVIEW_LABELS.ctaTitle}
        </h2>
        <p className="text-ui-muted mb-6 max-w-lg mx-auto">{ALGORITHM_OVERVIEW_LABELS.ctaDesc}</p>
        <Link
          href="/matching"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-ui-on-accent rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
        >
          {ALGORITHM_OVERVIEW_LABELS.ctaBtn}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
