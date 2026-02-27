import { COMPATIBILITY_GAP_LABELS, getLabel } from '@/lib/constants'

interface Props {
  conflictsByGap: Record<string, number>
  conflictPlacementsCount: number
  predictableCount: number
  unpredictableCount: number
  lowScoreCount: number
}

export function ConflictAnalysisSection({
  conflictsByGap,
  conflictPlacementsCount,
  predictableCount,
  unpredictableCount,
  lowScoreCount,
}: Props) {
  const totalPredictability = predictableCount + unpredictableCount

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 sm:mt-6">
      {/* Conflict Gap Breakdown */}
      <div className="card border-l-4 border-orange-400">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-orange-500 text-xl" aria-hidden="true">📊</span>
          <h2 className="text-lg font-semibold text-gray-900">
            Konfliktursachen
          </h2>
        </div>
        {Object.keys(conflictsByGap).length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">
              Noch keine detaillierten Konfliktdaten erfasst.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Bei zukünftigen Konfliktbeendigungen werden Ursachen dokumentiert.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(conflictsByGap)
              .sort((a, b) => b[1] - a[1])
              .map(([gap, count]) => (
                <div key={gap} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">
                        {getLabel(COMPATIBILITY_GAP_LABELS, gap)}
                      </span>
                      <span className="text-gray-500">
                        {count} ({Math.round((count / conflictPlacementsCount) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{
                          width: `${(count / conflictPlacementsCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Predictability Insights */}
      <div className="card border-l-4 border-blue-400">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-blue-500 text-xl" aria-hidden="true">🔮</span>
          <h2 className="text-lg font-semibold text-gray-900">
            Algorithmus-Einsichten
          </h2>
        </div>
        {conflictPlacementsCount === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">
              Noch keine Vorhersagbarkeits-Daten erfasst.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {predictableCount}
                </p>
                <p className="text-xs text-green-700">Vorhersehbar</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">
                  {unpredictableCount}
                </p>
                <p className="text-xs text-red-700">Nicht vorhersehbar</p>
              </div>
            </div>

            {totalPredictability > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>
                    {Math.round((predictableCount / totalPredictability) * 100)}%
                  </strong>{' '}
                  der Konflikte waren laut Fallarbeitern vorhersehbar.
                </p>
              </div>
            )}

            {lowScoreCount > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>{lowScoreCount}</strong> Konflikte hatten einen
                  Kompatibilitäts-Score unter 60% bei Platzierung.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  → Erwägen Sie höhere Schwellenwerte für Platzierungen
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
