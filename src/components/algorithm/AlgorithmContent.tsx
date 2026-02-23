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

export function AlgorithmContent() {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null)

  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'science', label: 'Forschung' },
    { id: 'dimensions', label: 'Faktoren' },
    { id: 'collection', label: 'Datenerfassung' },
    { id: 'technical', label: 'Technik' },
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
            <span className="text-white/80 text-sm font-medium">Evidenzbasiertes Matching</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Kompatibilitäts-Algorithmus
          </h1>

          <p className="text-lg text-white/90 mb-8 max-w-2xl">
            Basierend auf wissenschaftlicher Forschung zu Wohnkonflikten analysiert unser
            System {FACTOR_COUNT} Faktoren in {DIMENSION_COUNT} Dimensionen für harmonisches Zusammenleben.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <FactStat
              icon={<Layers className="w-5 h-5" />}
              value={String(DIMENSION_COUNT)}
              label="Dimensionen"
            />
            <FactStat
              icon={<Activity className="w-5 h-5" />}
              value={String(FACTOR_COUNT)}
              label="Faktoren"
            />
            <FactStat
              icon={<MapPin className="w-5 h-5" />}
              value="CH/DE/INT"
              label={`${SOURCE_COUNT} Quellen`}
            />
            <FactStat
              icon={<Shield className="w-5 h-5" />}
              value="Ethisch"
              label="gestaltet"
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
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
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
