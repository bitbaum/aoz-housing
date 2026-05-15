import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ResidentFormFields, FormValidationUX } from '@/components/forms'
import { updateResident } from '@/lib/actions'
import { ResidentDangerZone } from '@/components/residents/ResidentDangerZone'
import { RESIDENT_EDIT_LABELS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditResidentPage({ params }: Props) {
  const { id } = await params

  const resident = await prisma.resident.findUnique({
    where: { id },
  })

  if (!resident) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/residents/${id}`}
          className="text-aoz-primary hover:underline text-sm"
        >
          {RESIDENT_EDIT_LABELS.backLink}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
          {RESIDENT_EDIT_LABELS.title(resident.code)}
        </h1>
        <p className="text-gray-500">
          {RESIDENT_EDIT_LABELS.subtitle}
        </p>
      </div>

      <form id="resident-edit-form" action={updateResident} className="space-y-6">
        <input type="hidden" name="id" value={id} />

        <div id="resident-edit-validation-summary" className="hidden p-3 rounded border border-red-300 bg-red-50 text-red-800 text-sm" role="alert" />
        <FormValidationUX formId="resident-edit-form" summaryId="resident-edit-validation-summary" />

        <ResidentFormFields
          defaultValues={{
            code: resident.code,
            ageRange: resident.ageRange,
            gender: resident.gender,
            familyStatus: resident.familyStatus,
            sleepSchedule: resident.sleepSchedule,
            noiseTolerance: resident.noiseTolerance,
            cleanlinessLevel: resident.cleanlinessLevel,
            socialStyle: resident.socialStyle,
            languages: resident.languages,
            culturalRegion: resident.culturalRegion,
            smokingStatus: resident.smokingStatus,
            dietaryNeeds: resident.dietaryNeeds,
            mobilityNeeds: resident.mobilityNeeds,
            medicalEquipment: resident.medicalEquipment,
            petTolerance: resident.petTolerance,
            sharedBathroom: resident.sharedBathroom,
            sharedKitchen: resident.sharedKitchen,
            privacyNeed: resident.privacyNeed,
            // Household fields
            choresContribution: resident.choresContribution,
            recyclingKnowledge: resident.recyclingKnowledge,
            // Health/Support fields
            roomSharingStatus: resident.roomSharingStatus,
            hasNightDisturbances: resident.hasNightDisturbances,
            needsQuietEnvironment: resident.needsQuietEnvironment,
            hasSleepEquipment: resident.hasSleepEquipment,
            supportLevel: resident.supportLevel,
            // Medical documentation
            hasMedicalDocumentation: resident.hasMedicalDocumentation,
            medicalDocType: resident.medicalDocType,
            medicalDocDate: resident.medicalDocDate,
            medicalDocNotes: resident.medicalDocNotes,
            notes: resident.notes,
          }}
          isEdit
        />

        {/* Actions */}
        <div className="sticky bottom-0 -mx-4 px-4 py-3 sm:static sm:mx-0 sm:px-0 sm:py-0 bg-white/95 backdrop-blur border-t border-gray-200 sm:border-0 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 z-20">
          <button type="submit" className="btn-primary w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aoz-primary focus-visible:ring-offset-2">
            {RESIDENT_EDIT_LABELS.submit}
          </button>
          <Link href={`/residents/${id}`} className="btn-outline w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center">
            {RESIDENT_EDIT_LABELS.cancel}
          </Link>
        </div>
      </form>

      <ResidentDangerZone residentId={id} residentCode={resident.code} />
    </div>
  )
}
