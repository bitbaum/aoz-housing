import type { Metadata } from 'next'
import { ShieldOff } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { PageShell } from '@/components/ui/Page'
import { NO_ACCESS_LABELS, ROLE_LABELS } from '@/lib/constants/labels'
import { getCurrentUser } from '@/lib/auth'
import {
  PERMISSION_DESCRIPTIONS,
  isKnownPermission,
  rolesWithPermission,
} from '@/lib/config/permission-descriptions'

export const metadata: Metadata = { title: NO_ACCESS_LABELS.eyebrow }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ needs?: string }>
}

/**
 * Where `requirePermission()` sends someone whose role cannot open a page.
 *
 * It lives INSIDE the (admin) route group on purpose: the person keeps their
 * navigation and can carry on working. Being bounced to a bare error screen —
 * or worse, to /login — reads as "you are broken" rather than "that is
 * somebody else's desk".
 *
 * It says three things a generic error page cannot: what the page needed, who
 * has it, and that retrying is pointless. The role list is derived from
 * ROLE_PERMISSIONS, so "ask one of these people" stays true after the policy
 * changes.
 */
export default async function NoAccessPage({ searchParams }: Props) {
  const { needs } = await searchParams
  const user = await getCurrentUser()

  const permission = needs && isKnownPermission(needs) ? needs : null
  const capableRoles = permission ? rolesWithPermission(permission) : []

  return (
    <PageShell>
      <div className="card max-w-2xl p-6 sm:p-8">
        <span className="icon-container bg-ui-subtle text-ui-muted">
          <ShieldOff className="w-5 h-5" aria-hidden="true" />
        </span>

        <p className="eyebrow mt-4">{NO_ACCESS_LABELS.eyebrow}</p>
        <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-heading text-ui-text text-balance">
          {NO_ACCESS_LABELS.title}
        </h1>

        <p className="mt-3 text-ui-muted">
          {permission
            ? NO_ACCESS_LABELS.needs(PERMISSION_DESCRIPTIONS[permission])
            : NO_ACCESS_LABELS.needsUnknown}
        </p>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user && (
            <div>
              <dt className="eyebrow">{NO_ACCESS_LABELS.yourRole}</dt>
              <dd className="mt-1 text-ui-text">{ROLE_LABELS[user.role] ?? user.role}</dd>
            </div>
          )}
          {capableRoles.length > 0 && (
            <div>
              <dt className="eyebrow">{NO_ACCESS_LABELS.whoCan}</dt>
              <dd className="mt-1 text-ui-text">
                {capableRoles.map((role) => ROLE_LABELS[role] ?? role).join(', ')}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-6 text-sm text-ui-muted">{NO_ACCESS_LABELS.askHint}</p>
        <p className="mt-1 text-sm text-ui-muted">{NO_ACCESS_LABELS.retryIsPointless}</p>

        <div className="mt-6">
          <ButtonLink href="/">{NO_ACCESS_LABELS.backToDashboard}</ButtonLink>
        </div>
      </div>
    </PageShell>
  )
}
