import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requirePermission } from '@/lib/auth'
import { archiveOpportunity, publishOpportunity, updateOpportunity } from '@/lib/actions'
import { OpportunityFormFields } from '@/components/opportunities/OpportunityFormFields'
import { PageHeader } from '@/components/ui/Page'
import { getOpportunityDetail } from '@/lib/data/opportunities'
import { OPPORTUNITIES_ADMIN_LABELS as L } from '@/lib/constants'

export const metadata: Metadata = { title: L.editTitle }
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditOpportunityPage({ params }: Props) {
  await requirePermission('opportunities:write')
  const { id } = await params
  const opportunity = await getOpportunityDetail(id)
  if (!opportunity) notFound()

  const publish = publishOpportunity.bind(null, id)
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

      <form action={updateOpportunity} className="card space-y-6">
        <OpportunityFormFields opportunity={opportunity} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">{L.save}</button>
          <Link href={`/opportunities/${id}`} className="btn-outline">{L.cancel}</Link>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-3">
        {opportunity.status !== 'PUBLISHED' ? (
          <form action={publish}>
            <button type="submit" className="btn-outline">{L.publish}</button>
          </form>
        ) : null}
        {opportunity.status !== 'ARCHIVED' ? (
          <form action={archive}>
            <button type="submit" className="btn-outline">{L.archive}</button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
