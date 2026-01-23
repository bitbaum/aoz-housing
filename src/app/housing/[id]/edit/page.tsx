import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { HousingFormFields } from '@/components/forms'
import { updateHousingUnit } from '@/lib/actions'

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
          className="text-aoz-primary hover:underline text-sm"
        >
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {unit.code} bearbeiten
        </h1>
        <p className="text-gray-500">
          Aktualisieren Sie die Informationen der Unterkunft
        </p>
      </div>

      <form action={updateHousingUnit} className="space-y-6">
        <input type="hidden" name="id" value={id} />

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
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Änderungen speichern
          </button>
          <Link href={`/housing/${id}`} className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
