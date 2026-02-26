'use client'

import {
  BookOpen,
  Beaker,
  Grid3X3,
  Activity,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { RESIDENT_DIMENSIONS } from '@/lib/config/resident-factors'
import {
  RESEARCH_SOURCES,
  FACTOR_SCIENCE,
  RESEARCH_METHODOLOGY,
  getSourcesByRegion,
  getSourceById,
  type ResearchSource,
} from '@/lib/config/algorithm-docs'
import {
  SOURCE_COUNT,
  getFactorsByDimension,
  EvidenceStrengthBadge,
  EvidenceStrengthBar,
} from './shared'

export function ScienceTab() {
  const swissSources = getSourcesByRegion('CH')
  const germanSources = getSourcesByRegion('DE')
  const intlSources = getSourcesByRegion('INT')

  return (
    <div className="space-y-6">
      {/* Introduction */}
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

      {/* Research Methodology Hierarchy */}
      <section className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Beaker className="w-5 h-5 text-gray-500" />
          Evidenz-Hierarchie
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Nicht alle Forschung hat die gleiche Aussagekraft. Wir bewerten jede Quelle nach
          ihrer methodischen Stärke.
        </p>

        <div className="space-y-3">
          {RESEARCH_METHODOLOGY.map(method => (
            <div
              key={method.type}
              className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="flex-shrink-0">
                <EvidenceStrengthBadge strength={method.strength} />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900">{method.type}</h4>
                <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                <p className="text-xs text-gray-500 mt-1 italic">Beispiel: {method.example}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Evidence Map per Dimension */}
      <section className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-gray-500" />
          Evidenz-Karte pro Dimension
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Welche Forschung stützt welche Dimension? Schweizer Studien sind mit einem Flag markiert.
        </p>

        <div className="space-y-6">
          {RESIDENT_DIMENSIONS.map(dim => {
            const factors = getFactorsByDimension(dim.id)
            // Collect all unique source IDs for this dimension
            const dimensionSourceIds = new Set<string>()
            factors.forEach(f => {
              const science = FACTOR_SCIENCE[f.id]
              if (science) {
                science.sourceIds.forEach(id => dimensionSourceIds.add(id))
              }
            })
            const dimensionSources = Array.from(dimensionSourceIds)
              .map(id => getSourceById(id))
              .filter((s): s is ResearchSource => s !== undefined)

            if (dimensionSources.length === 0) return null

            return (
              <div key={dim.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{dim.label}</h4>
                    <span className="text-xs text-gray-500">
                      {Math.round(dim.weight * 100)}% Gewicht
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{dim.description}</p>
                </div>
                <div className="p-4 space-y-2">
                  {dimensionSources.map(source => (
                    <div
                      key={source.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {source.region === 'CH' && <span className="flex-shrink-0">🇨🇭</span>}
                        {source.region === 'DE' && <span className="flex-shrink-0">🇩🇪</span>}
                        {source.region === 'INT' && <span className="flex-shrink-0">🌍</span>}
                        <span className="text-gray-700 truncate">{source.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 pl-6 sm:pl-0">
                        <EvidenceStrengthBadge strength={source.evidenceStrength} />
                        {source.year && (
                          <span className="text-xs text-gray-500">{source.year}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Per-Factor Evidence Cards */}
      <section className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-500" />
          Evidenz pro Faktor
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Detaillierte wissenschaftliche Grundlage für jeden Kompatibilitätsfaktor.
        </p>

        <div className="space-y-6">
          {RESIDENT_DIMENSIONS.map(dim => {
            const factors = getFactorsByDimension(dim.id)
            const factorsWithScience = factors.filter(f => FACTOR_SCIENCE[f.id])
            if (factorsWithScience.length === 0) return null

            return (
              <div key={dim.id}>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {dim.label}
                </h4>
                <div className="space-y-3">
                  {factorsWithScience.map(factor => {
                    const science = FACTOR_SCIENCE[factor.id]!
                    const sources = science.sourceIds
                      .map(id => getSourceById(id))
                      .filter((s): s is ResearchSource => s !== undefined)

                    return (
                      <div key={factor.id} className="border border-gray-200 rounded-lg p-4">
                        {/* Header with name and evidence badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h5 className="font-medium text-gray-900">{factor.label}</h5>
                          <EvidenceStrengthBadge strength={science.evidenceStrength} />
                        </div>

                        {/* Evidence strength bar */}
                        <EvidenceStrengthBar strength={science.evidenceStrength} />

                        {/* Evidence note */}
                        <p className="text-xs text-gray-500 mt-2 italic">{science.evidenceNote}</p>

                        {/* Key quantitative findings */}
                        <div className="mt-3 space-y-1">
                          {science.researchFindings.map((finding, i) => (
                            <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-aoz-primary mt-0.5 flex-shrink-0">-</span>
                              <span>{finding}</span>
                            </p>
                          ))}
                        </div>

                        {/* Swiss context */}
                        {science.swissContext && (
                          <p className="text-xs text-aoz-primary mt-3 flex items-start gap-1.5 bg-green-50 rounded px-2 py-1.5">
                            <span className="flex-shrink-0">🇨🇭</span>
                            <span>{science.swissContext}</span>
                          </p>
                        )}

                        {/* Source citations */}
                        {sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Quellen:</p>
                            <div className="flex flex-wrap gap-1">
                              {sources.map(source => (
                                <span
                                  key={source.id}
                                  className="text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded"
                                  title={source.title}
                                >
                                  {source.publication?.split('/')[0]?.trim() || source.title}
                                  {source.year ? ` (${source.year})` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Full Source Table */}
      <section className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          Quellenverzeichnis ({SOURCE_COUNT} Quellen)
        </h3>

        {/* Mobile: card layout; Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-3 font-medium text-gray-500">Titel</th>
                <th className="text-left py-2 pr-3 font-medium text-gray-500">Region</th>
                <th className="text-left py-2 pr-3 font-medium text-gray-500">Jahr</th>
                <th className="text-left py-2 pr-3 font-medium text-gray-500">Publikation</th>
                <th className="text-left py-2 font-medium text-gray-500">Evidenz</th>
              </tr>
            </thead>
            <tbody>
              {RESEARCH_SOURCES.map(source => (
                <tr key={source.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{source.title}</span>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-aoz-primary flex-shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {source.region === 'CH' && '🇨🇭 Schweiz'}
                    {source.region === 'DE' && '🇩🇪 Deutschland'}
                    {source.region === 'INT' && '🌍 International'}
                  </td>
                  <td className="py-2 pr-3 text-gray-500">
                    {source.year || '-'}
                  </td>
                  <td className="py-2 pr-3 text-gray-500 max-w-[200px] truncate">
                    {source.publication || '-'}
                  </td>
                  <td className="py-2">
                    <EvidenceStrengthBadge strength={source.evidenceStrength} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked cards */}
        <div className="md:hidden space-y-3">
          {RESEARCH_SOURCES.map(source => (
            <div key={source.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-gray-900">{source.title}</h4>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aoz-primary flex-shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>
                  {source.region === 'CH' && '🇨🇭 Schweiz'}
                  {source.region === 'DE' && '🇩🇪 Deutschland'}
                  {source.region === 'INT' && '🌍 International'}
                </span>
                {source.year && <span>{source.year}</span>}
                <EvidenceStrengthBadge strength={source.evidenceStrength} />
              </div>
              {source.publication && (
                <p className="text-xs text-gray-500 mt-1">{source.publication}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
