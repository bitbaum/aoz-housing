import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ResidentFormFields } from '@/components/forms'
import { updateResident } from '@/lib/actions'

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
          ← Zurück zum Profil
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {resident.code} bearbeiten
        </h1>
        <p className="text-gray-500">
          Aktualisieren Sie die Informationen des Bewohners
        </p>
      </div>

      <form action={updateResident} className="space-y-6">
        <input type="hidden" name="id" value={id} />

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
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Änderungen speichern
          </button>
          <Link href={`/residents/${id}`} className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
