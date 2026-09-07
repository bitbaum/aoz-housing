import type { ClientFactsForDossier } from '@/lib/client-facts/dossier'
import { renewalState } from '@/lib/client-facts/policy'
import { CLIENT_FACT_LABELS as L } from '@/lib/constants/labels'
import { formatDate } from '@/lib/utils'

/**
 * What a client keeps about their own admin life, on their dossier.
 *
 * Every kind here was invisible to staff the moment it was confirmed — the
 * approval queue only ever shows PENDING. This is where a Betreuerin actually
 * looks something up.
 *
 * The card renders only the kinds this viewer may read; a kind they may not
 * read was never queried, so there is nothing here to hide. An EMPTY kind and
 * a FORBIDDEN kind are different facts and must not look the same: forbidden
 * is absent entirely, empty says so in words.
 */
export function ClientFactsCard({ facts }: { facts: ClientFactsForDossier }) {
  if (!facts.anyVisible) return null

  return (
    <div className="card">
      <h2 className="font-semibold text-ui-text">{L.dossierTitle}</h2>
      <p className="mt-1 text-xs text-ui-muted">{L.dossierHint}</p>

      {facts.insurances && (
        <section className="mt-4 border-t border-ui-border pt-3">
          <p className="eyebrow">{L.kinds.INSURANCE}</p>
          {facts.insurances.length === 0 ? (
            <p className="mt-1 text-sm text-ui-muted">{L.dossierEmpty}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {facts.insurances.map((row) => (
                <li key={row.id}>
                  <p className="text-sm text-ui-text">
                    {row.insurerName}
                    {row.policyNumber && (
                      <span className="numeric text-xs text-ui-muted"> · {row.policyNumber}</span>
                    )}
                  </p>
                  <Expiry validUntil={row.validUntil} status={row.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {facts.contacts && (
        <section className="mt-4 border-t border-ui-border pt-3">
          <p className="eyebrow">{L.kinds.HEALTH_CONTACT}</p>
          {facts.contacts.length === 0 ? (
            <p className="mt-1 text-sm text-ui-muted">{L.dossierEmpty}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {facts.contacts.map((row) => (
                <li key={row.id}>
                  <p className="text-sm text-ui-text">
                    {row.name} <span className="text-xs text-ui-muted">· {row.profession}</span>
                  </p>
                  {/* The phone number is the point: it is what saves a message
                      to the Betreuung asking who to call. */}
                  {row.phone && <p className="numeric text-xs text-ui-muted">{row.phone}</p>}
                  {row.address && <p className="text-xs text-ui-muted">{row.address}</p>}
                  <StatusLine status={row.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {facts.permit !== undefined && facts.permit !== null && (
        <section className="mt-4 border-t border-ui-border pt-3">
          <p className="eyebrow">{L.kinds.PERMIT}</p>
          <p className="mt-1 text-sm text-ui-text">{L.permitTypes[facts.permit.type]}</p>
          <Expiry validUntil={facts.permit.validUntil} status={facts.permit.status} />
        </section>
      )}

      <p className="mt-4 text-2xs text-ui-muted">{L.confirmMeaning}</p>
    </div>
  )
}

/** The date plus how close it is, because a date alone makes the reader do arithmetic. */
function Expiry({ validUntil, status }: { validUntil: Date | null; status: string }) {
  const state = renewalState(validUntil, new Date())
  return (
    <p className="mt-1 text-xs">
      {validUntil ? (
        <span
          className={
            state === 'expired'
              ? 'text-status-error-text'
              : state === 'due'
                ? 'text-status-warning-text'
                : 'text-ui-muted'
          }
        >
          {L.fields.validUntil}: {formatDate(validUntil)}
        </span>
      ) : (
        <span className="text-ui-muted">{L.renewal.none}</span>
      )}
      <span className="text-ui-muted"> · {L.status[status] ?? status}</span>
    </p>
  )
}

function StatusLine({ status }: { status: string }) {
  return <p className="mt-1 text-xs text-ui-muted">{L.status[status] ?? status}</p>
}
