import { ExternalLink } from 'lucide-react'
import { RESEARCH_SOURCES } from '@/lib/config/algorithm-docs'
import { EvidenceStrengthBadge } from './shared'

export function ResearchSourceTable({ count }: { count: number }) {
  return (
    <section className="card">
      <h3 className="font-semibold text-ui-text mb-4 flex items-center gap-2">
        <ExternalLink className="w-5 h-5 text-ui-muted" />
        Quellenverzeichnis ({count} Quellen)
      </h3>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ui-border">
              <th scope="col" className="text-left py-2 pr-3 font-medium text-ui-muted">Titel</th>
              <th scope="col" className="text-left py-2 pr-3 font-medium text-ui-muted">Region</th>
              <th scope="col" className="text-left py-2 pr-3 font-medium text-ui-muted">Jahr</th>
              <th scope="col" className="text-left py-2 pr-3 font-medium text-ui-muted">Publikation</th>
              <th scope="col" className="text-left py-2 font-medium text-ui-muted">Evidenz</th>
            </tr>
          </thead>
          <tbody>
            {RESEARCH_SOURCES.map(source => (
              <tr key={source.id} className="border-b border-ui-border">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-ui-text">{source.title}</span>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-brand-primary shrink-0"
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
                <td className="py-2 pr-3 text-ui-muted">
                  {source.year || '-'}
                </td>
                <td className="py-2 pr-3 text-ui-muted max-w-[200px] truncate">
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

      <div className="md:hidden space-y-3">
        {RESEARCH_SOURCES.map(source => (
          <div key={source.id} className="border border-ui-border rounded-lg p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-medium text-ui-text">{source.title}</h4>
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-brand-primary shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ui-muted">
              <span>
                {source.region === 'CH' && '🇨🇭 Schweiz'}
                {source.region === 'DE' && '🇩🇪 Deutschland'}
                {source.region === 'INT' && '🌍 International'}
              </span>
              {source.year && <span>{source.year}</span>}
              <EvidenceStrengthBadge strength={source.evidenceStrength} />
            </div>
            {source.publication && (
              <p className="text-xs text-ui-muted mt-1">{source.publication}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
