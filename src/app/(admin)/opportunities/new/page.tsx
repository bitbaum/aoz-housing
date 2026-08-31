import type { Metadata } from 'next'
import Link from 'next/link'
import { requirePermission } from '@/lib/auth'
import { createOpportunity } from '@/lib/actions'
import { OpportunityFormFields } from '@/components/opportunities/OpportunityFormFields'
import { PageHeader } from '@/components/ui/Page'
import { OPPORTUNITIES_ADMIN_LABELS as L } from '@/lib/constants'

export const metadata: Metadata = { title: L.createTitle }
export const dynamic = 'force-dynamic'

export default async function NewOpportunityPage() {
  await requirePermission('opportunities:write')

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <PageHeader
          title={L.createTitle}
          description={L.createDescription}
          backHref="/opportunities"
          backLabel={L.detailBack}
        />
      </div>

      <form action={createOpportunity} className="card space-y-6">
        <OpportunityFormFields />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            {L.save}
          </button>
          <Link href="/opportunities" className="btn-outline">
            {L.cancel}
          </Link>
        </div>
      </form>
    </div>
  )
}
