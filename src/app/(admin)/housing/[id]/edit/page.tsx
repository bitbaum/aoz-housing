import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { HousingFormFields, FormValidationUX } from '@/components/forms'
import { updateHousingUnit } from '@/lib/actions'
import { HousingDangerZone } from '@/components/housing/HousingDangerZone'
import { HOUSING_EDIT_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Unterkunft bearbeiten' }

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditHousingPage({ params }: Props) {
  const { id } = await params

  const unit = await prisma.housingUnit.findUnique({
    where: { id },
  })

  if (!unit) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/housing/${id}`}
          className="inline-flex items-center min-h-[44px] px-1 -ml-1 text-sm text-aoz-primary hover:underline"
        >
          {HOUSING_EDIT_LABELS.backLink}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
          {HOUSING_EDIT_LABELS.title(unit.code)}
        </h1>
        <p className="text-gray-500">
          {HOUSING_EDIT_LABELS.subtitle}
        </p>
      </div>

      <form id="housing-edit-form" action={updateHousingUnit} className="space-y-6">
        <input type="hidden" name="id" value={id} />

        <div id="housing-edit-validation-summary" className="hidden p-3 rounded border border-red-300 bg-red-50 text-red-800 text-sm" role="alert" />
        <FormValidationUX formId="housing-edit-form" summaryId="housing-edit-validation-summary" />

        <HousingFormFields
          defaultValues={{
            code: unit.code,
            address: unit.address,
            totalBeds: unit.totalBeds,
            totalRooms: unit.totalRooms,
            sharedRooms: unit.sharedRooms,
            privateRooms: unit.privateRooms,
            sharedBathrooms: unit.sharedBathrooms,
            privateBathrooms: unit.privateBathrooms,
            sharedKitchen: unit.sharedKitchen,
            privateKitchen: unit.privateKitchen,
            groundFloor: unit.groundFloor,
            wheelchairAccess: unit.wheelchairAccess,
            elevator: unit.elevator,
            smokingAllowed: unit.smokingAllowed,
            petsAllowed: unit.petsAllowed,
            quietHours: unit.quietHours,
            nearPublicTransport: unit.nearPublicTransport,
            nearHealthServices: unit.nearHealthServices,
            nearSchools: unit.nearSchools,
            notes: unit.notes,
          }}
          isEdit
        />

        {/* Actions */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-white/95 backdrop-blur border-t border-gray-200 sm:border-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 z-20">
          <button type="submit" className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
            {HOUSING_EDIT_LABELS.submit}
          </button>
          <Link href={`/housing/${id}`} className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
            {HOUSING_EDIT_LABELS.cancel}
          </Link>
        </div>
      </form>

      <HousingDangerZone housingUnitId={id} code={unit.code} />
    </div>
  )
}
