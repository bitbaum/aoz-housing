import type { Metadata } from 'next'
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

      {/* The form element lives inside the component, so a rejected save
          returns into it instead of unmounting the route and discarding every
          field. @see lib/actions/opportunities OpportunityFormState */}
      <OpportunityFormFields action={createOpportunity} cancelHref="/opportunities" />
    </div>
  )
}
