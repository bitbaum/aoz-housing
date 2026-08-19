import { formatRappen, type MonthlyStatement } from '@/lib/expenses'
import type { ExpenseLabels } from '@/lib/i18n/portal-surfaces'

interface MonthlyStatementsProps {
  statements: MonthlyStatement[]
  /** residentId → display name (SSOT-resolved by the page). */
  nameOf: Record<string, string>
  labels: ExpenseLabels
}

/**
 * Per-month accounting: who paid what, who consumed what, net per person.
 * The newest month is expanded; history stays one tap away. Server-rendered —
 * a <details> element needs no JavaScript.
 */
export function MonthlyStatements({ statements, nameOf, labels: L }: MonthlyStatementsProps) {
  if (statements.length === 0) return null

  return (
    <div className="card mt-6">
      <h2 className="text-lg font-semibold text-ui-text mb-1">{L.statementTitle}</h2>
      <p className="text-sm text-ui-muted mb-4">{L.statementSubtitle}</p>

      <div className="space-y-3">
        {statements.map((statement, index) => (
          <details
            key={statement.monthKey}
            open={index === 0}
            className="border border-ui-border rounded-lg"
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer select-none min-h-[44px] px-4 py-2">
              <span className="font-medium text-ui-text">{statement.monthLabel}</span>
              <span className="text-sm text-ui-muted numeric">
                {statement.expenseCount} {L.statementExpenses} · {L.statementTotal}{' '}
                {formatRappen(statement.totalRappen)}
              </span>
            </summary>
            <div className="px-4 pb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start border-b border-ui-border">
                    <th className="eyebrow py-2 font-semibold">{L.statementPerson}</th>
                    <th className="eyebrow py-2 font-semibold text-end">{L.statementPaid}</th>
                    <th className="eyebrow py-2 font-semibold text-end">{L.statementShare}</th>
                    <th className="eyebrow py-2 font-semibold text-end">{L.statementNet}</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.rows.map((row) => (
                    <tr key={row.residentId} className="border-b border-ui-border last:border-0">
                      <td className="py-2 text-ui-text">{nameOf[row.residentId] ?? '–'}</td>
                      <td className="py-2 text-end numeric text-ui-text">
                        {formatRappen(row.paidRappen)}
                      </td>
                      <td className="py-2 text-end numeric text-ui-text">
                        {formatRappen(row.shareRappen)}
                      </td>
                      <td
                        className={`py-2 text-end numeric font-medium ${
                          row.netRappen > 0
                            ? 'text-status-success-text'
                            : row.netRappen < 0
                              ? 'text-status-error-text'
                              : 'text-ui-muted'
                        }`}
                      >
                        {row.netRappen > 0 ? '+' : ''}
                        {formatRappen(row.netRappen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-ui-muted mt-3">{L.statementNetHint}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
