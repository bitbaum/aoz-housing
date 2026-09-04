import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/auth'
import { archiveOpportunity, updateOpportunity } from '@/lib/actions'
import { publishOpportunityFromEdit } from '@/lib/actions/opportunities'
import { OpportunityFormFields } from '@/components/opportunities/OpportunityFormFields'
import { PageHeader } from '@/components/ui/Page'
import { getOpportunityDetail } from '@/lib/data/opportunities'
import { OPPORTUNITIES_ADMIN_LABELS as L } from '@/lib/constants'

export const metadata: Metadata = { title: L.editTitle }
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function EditOpportunityPage({ params, searchParams }: Props) {
  await requirePermission('opportunities:write')
  const { id } = await params
  const { error } = await searchParams
  const opportunity = await getOpportunityDetail(id)
  if (!opportunity) notFound()

  const publish = publishOpportunityFromEdit.bind(null, id)
  const archive = archiveOpportunity.bind(null, id)

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <PageHeader
          title={L.editTitle}
          description={opportunity.title}
          backHref={`/opportunities/${id}`}
          backLabel={L.detailBack}
        />
      </div>

      {/* Why the reason reaches the screen at all: the gate's message used to
          be swallowed by the error boundary. @see OpportunityFormState */}
      {error ? (
        <p className="alert-error mb-4" role="alert">
          {error}
        </p>
      ) : null}

      <OpportunityFormFields
        opportunity={opportunity}
        action={updateOpportunity}
        cancelHref={`/opportunities/${id}`}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        {opportunity.status !== 'PUBLISHED' ? (
          <form action={publish}>
            <button type="submit" className="btn-outline">
              {L.publish}
            </button>
          </form>
        ) : null}
        {opportunity.status !== 'ARCHIVED' ? (
          <form action={archive}>
            <button type="submit" className="btn-outline">
              {L.archive}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
