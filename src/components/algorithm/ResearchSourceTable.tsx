import { ExternalLink } from 'lucide-react'
import { RESEARCH_SOURCES } from '@/lib/config/algorithm-docs'
import { EvidenceStrengthBadge } from './shared'

export function ResearchSourceTable({ count }: { count: number }) {
  return (
    <section className="card">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ExternalLink className="w-5 h-5 text-gray-500" />
        Quellenverzeichnis ({count} Quellen)
      </h3>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="text-left py-2 pr-3 font-medium text-gray-500">Titel</th>
              <th scope="col" className="text-left py-2 pr-3 font-medium text-gray-500">Region</th>
              <th scope="col" className="text-left py-2 pr-3 font-medium text-gray-500">Jahr</th>
              <th scope="col" className="text-left py-2 pr-3 font-medium text-gray-500">Publikation</th>
              <th scope="col" className="text-left py-2 font-medium text-gray-500">Evidenz</th>
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
  )
}
