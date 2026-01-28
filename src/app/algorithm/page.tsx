'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Brain,
  Shield,
  Users,
  Home,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  Target,
  Scale,
  BookOpen,
  Layers,
  Activity,
  ExternalLink,
  FileText,
  Database,
  MapPin,
} from 'lucide-react'
import { Tabs } from '@/components/ui'

// Import configs - these are the SSOT
import {
  RESIDENT_DIMENSIONS,
  RESIDENT_FACTORS,
  RESIDENT_FORM_SECTIONS,
} from '@/lib/config/resident-factors'
import {
  RESEARCH_SOURCES,
  FACTOR_SCIENCE,
  RULE_DOCUMENTATION,
  getSourcesByRegion,
  getSourceById,
  type ResearchSource,
} from '@/lib/config/algorithm-docs'

// =============================================================================
// Derived Data from Config (SSOT)
// =============================================================================

// Count factors with compatibility impact (weight > 0)
const FACTOR_COUNT = Object.values(RESIDENT_FACTORS).filter(f => f.weight > 0).length
const DIMENSION_COUNT = RESIDENT_DIMENSIONS.length

// Get factors by dimension
function getFactorsByDimension(dimensionId: string) {
  return Object.values(RESIDENT_FACTORS)
    .filter(f => f.dimension === dimensionId && f.weight > 0)
    .sort((a, b) => b.weight - a.weight)
}

// =============================================================================
// Page Component
// =============================================================================

export default function AlgorithmPage() {
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
              value="CH/DE"
              label="Forschung"
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

// =============================================================================
// Fact Stat Component
// =============================================================================

function FactStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      <div className="flex items-center gap-2 text-white/70 mb-1">{icon}</div>
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  )
}

// =============================================================================
// Overview Tab
// =============================================================================

function OverviewTab() {
  return (
    <div className="space-y-8">
      {/* How it Works */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-aoz-primary" />
          So funktioniert das Matching
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <ProcessStep
            number={1}
            title="Profil erfassen"
            description="Bei der Aufnahme werden Präferenzen und Bedürfnisse systematisch erfasst."
            icon={<Users className="w-6 h-6" />}
          />
          <ProcessStep
            number={2}
            title="Kompatibilität berechnen"
            description={`${FACTOR_COUNT} Faktoren werden gewichtet verglichen.`}
            icon={<Brain className="w-6 h-6" />}
          />
          <ProcessStep
            number={3}
            title="Empfehlung erhalten"
            description="Ein Score zeigt die Eignung, Warnungen weisen auf Risiken hin."
            icon={<Scale className="w-6 h-6" />}
          />
        </div>
      </section>

      {/* Dimensions from Config */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-aoz-primary" />
          Die {DIMENSION_COUNT} Dimensionen
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RESIDENT_DIMENSIONS.map((dim, i) => {
            const colors = ['purple', 'blue', 'green', 'orange'] as const
            const factors = getFactorsByDimension(dim.id)
            return (
              <DimensionCard
                key={dim.id}
                name={dim.label}
                weight={Math.round(dim.weight * 100)}
                color={colors[i % colors.length]}
                description={dim.description}
                factorCount={factors.length}
              />
            )
          })}
        </div>
      </section>

      {/* Score Scale */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Scale className="w-5 h-5 text-aoz-primary" />
          Score-Interpretation
        </h2>

        <p className="text-gray-600 mb-6">
          Der Kompatibilitäts-Score (0-100) zeigt, wie gut Bewohner zusammenpassen.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <ScoreLevel score="80-100" label="Sehr gut" color="green" action="Empfohlen" />
          <ScoreLevel score="60-79" label="Gut" color="emerald" action="Gute Option" />
          <ScoreLevel score="40-59" label="Mittel" color="yellow" action="Mit Begleitung" />
          <ScoreLevel score="20-39" label="Niedrig" color="orange" action="Vermeiden" />
          <ScoreLevel score="0-19" label="Kritisch" color="red" action="Blockiert" />
        </div>
      </section>
    </div>
  )
}

// =============================================================================
// Science Tab - Research Basis
// =============================================================================

function ScienceTab() {
  const swissSources = getSourcesByRegion('CH')
  const germanSources = getSourcesByRegion('DE')
  const intlSources = getSourcesByRegion('INT')

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-aoz-primary" />
          Wissenschaftliche Grundlage
        </h2>
        <p className="text-gray-600">
          Die Faktorenauswahl basiert auf Forschung zu Wohnkonflikten aus der Schweiz, Deutschland
          und internationalen Studien. Die Gewichtungen spiegeln die empirisch belegte Bedeutung wider.
        </p>
      </section>

      {/* Swiss Research */}
      {swissSources.length > 0 && (
        <section className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🇨🇭</span> Schweizer Forschung
          </h3>
          <div className="space-y-4">
            {swissSources.map(source => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </section>
      )}

      {/* German Research */}
      {germanSources.length > 0 && (
        <section className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🇩🇪</span> Deutsche Forschung
          </h3>
          <div className="space-y-4">
            {germanSources.map(source => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </section>
      )}

      {/* International Research */}
      {intlSources.length > 0 && (
        <section className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🌍</span> Internationale Studien
          </h3>
          <div className="space-y-4">
            {intlSources.map(source => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SourceCard({ source }: { source: ResearchSource }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-gray-900">{source.title}</h4>
          <p className="text-sm text-gray-500">
            {source.publication}
            {source.year && ` (${source.year})`}
          </p>
        </div>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-aoz-primary hover:underline text-sm flex items-center gap-1 flex-shrink-0"
          >
            Quelle <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      {source.keyFindings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {source.keyFindings.map((finding, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-aoz-primary mt-0.5">•</span>
              {finding}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// =============================================================================
// Dimensions Tab - Factor Details from Config
// =============================================================================

function DimensionsTab({
  expandedDimension,
  setExpandedDimension,
}: {
  expandedDimension: string | null
  setExpandedDimension: (id: string | null) => void
}) {
  const colors = {
    lifestyle: 'purple',
    social: 'blue',
    practical: 'green',
    requirements: 'orange',
  } as const

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Alle Faktoren werden direkt aus der Algorithmus-Konfiguration generiert.
        Klicken Sie auf eine Dimension für Details.
      </p>

      {RESIDENT_DIMENSIONS.map(dim => {
        const factors = getFactorsByDimension(dim.id)
        const isExpanded = expandedDimension === dim.id

        return (
          <div key={dim.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedDimension(isExpanded ? null : dim.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-${colors[dim.id as keyof typeof colors]}-500`} />
                <div>
                  <h3 className="font-semibold text-gray-900">{dim.label}</h3>
                  <p className="text-sm text-gray-500">{dim.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{factors.length} Faktoren</span>
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700">
                  {Math.round(dim.weight * 100)}%
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 border-t border-gray-100">
                <div className="space-y-3 mt-4">
                  {factors.map(factor => {
                    const science = FACTOR_SCIENCE[factor.id]
                    return (
                      <div key={factor.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{factor.label}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">
                              {Math.round(factor.weight * 100)}%
                            </span>
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {factor.rule.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        {factor.description && (
                          <p className="text-sm text-gray-600 mb-2">{factor.description}</p>
                        )}
                        {science && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-700">{science.whyItMatters}</p>
                            {science.swissContext && (
                              <p className="text-xs text-aoz-primary mt-2 flex items-start gap-1">
                                <span>🇨🇭</span> {science.swissContext}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// =============================================================================
// Data Collection Tab
// =============================================================================

function DataCollectionTab() {
  // Get factors that have science documentation
  const documentedFactors = Object.values(RESIDENT_FACTORS).filter(
    f => FACTOR_SCIENCE[f.id]?.dataCollectionMethod
  )

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-aoz-primary" />
          Wie werden die Daten erfasst?
        </h2>
        <p className="text-gray-600 mb-4">
          Alle Daten werden bei der Aufnahme durch das Bewohner-Formular erfasst.
          Die Fragen sind so gestaltet, dass sie ohne Sprachbarrieren verständlich sind
          (Skalen, Bildauswahl wo möglich).
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Datenschutz-Grundsätze</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Nur funktionale Daten, keine medizinischen Diagnosen</li>
            <li>• Selbstauskunft der Bewohner</li>
            <li>• Anonymisierte Verarbeitung</li>
            <li>• Keine politischen/religiösen Daten</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          Erfassungsmethoden pro Faktor
        </h3>

        <div className="space-y-4">
          {documentedFactors.map(factor => {
            const science = FACTOR_SCIENCE[factor.id]
            if (!science) return null

            return (
              <div key={factor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{factor.label}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                    {factor.type === 'scale' ? 'Skala 1-5' : factor.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{science.dataCollectionMethod}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Formular-Sektionen</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {RESIDENT_FORM_SECTIONS.filter(s => s.id !== 'notes').map(section => {
            const factorCount = Object.values(RESIDENT_FACTORS).filter(
              f => f.formSection === section.id
            ).length
            return (
              <div key={section.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{section.label}</span>
                  <span className="text-xs text-gray-500">{factorCount} Felder</span>
                </div>
                {section.description && (
                  <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// =============================================================================
// Technical Tab
// =============================================================================

function TechnicalTab() {
  return (
    <div className="space-y-6">
      {/* Scoring Rules */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5 text-aoz-primary" />
          Bewertungsregeln
        </h2>

        <div className="space-y-4">
          {RULE_DOCUMENTATION.map(rule => (
            <div key={rule.rule} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">{rule.name}</h4>
                <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{rule.rule}</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
              <p className="text-sm text-gray-500 italic">Beispiel: {rule.example}</p>
              <p className="text-xs text-gray-400 mt-2">Logik: {rule.scoringLogic}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blocking */}
      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Blockierung
        </h2>

        <p className="text-gray-600 mb-4">
          Bei kritischen Inkompatibilitäten wird die Platzierung <strong>blockiert</strong>:
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-red-900">Harte Anforderungen:</span>{' '}
              <span className="text-red-800">
                Rollstuhlzugang, Einzelzimmer-Bedarf, etc. müssen erfüllt sein
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-red-900">Extreme Differenzen:</span>{' '}
              <span className="text-red-800">
                3+ Stufen Unterschied bei Sauberkeit oder Lärmtoleranz
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-red-900">Inkompatibles Verhalten:</span>{' '}
              <span className="text-red-800">
                Innen-Raucher + Nichtraucher in gleicher Einheit
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Config Location */}
      <section className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-500" />
          Konfiguration (SSOT)
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Alle Faktoren, Gewichtungen und Regeln sind in der Konfiguration definiert.
          Änderungen dort aktualisieren automatisch diese Seite und den Algorithmus.
        </p>
        <div className="font-mono text-xs text-gray-500 space-y-1">
          <p>src/lib/config/resident-factors.ts → Faktoren & Dimensionen</p>
          <p>src/lib/config/algorithm-docs.ts → Wissenschaftliche Basis</p>
          <p>src/lib/config/types.ts → Typdefinitionen</p>
        </div>
      </section>
    </div>
  )
}

// =============================================================================
// Helper Components
// =============================================================================

function ProcessStep({
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

function DimensionCard({
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

function ScoreLevel({
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
