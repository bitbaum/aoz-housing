import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function createHousingUnit(formData: FormData) {
  'use server'

  const code = formData.get('code') as string
  const address = formData.get('address') as string
  const totalBeds = parseInt(formData.get('totalBeds') as string)
  const totalRooms = parseInt(formData.get('totalRooms') as string)
  const sharedRooms = parseInt(formData.get('sharedRooms') as string) || 0
  const privateRooms = parseInt(formData.get('privateRooms') as string) || 0
  const sharedBathrooms = parseInt(formData.get('sharedBathrooms') as string) || 0
  const privateBathrooms = parseInt(formData.get('privateBathrooms') as string) || 0
  const sharedKitchen = formData.get('sharedKitchen') === 'true'
  const privateKitchen = formData.get('privateKitchen') === 'true'
  const groundFloor = formData.get('groundFloor') === 'true'
  const wheelchairAccess = formData.get('wheelchairAccess') === 'true'
  const elevator = formData.get('elevator') === 'true'
  const smokingAllowed = formData.get('smokingAllowed') === 'true'
  const petsAllowed = formData.get('petsAllowed') === 'true'
  const quietHours = formData.get('quietHours') as string
  const nearPublicTransport = formData.get('nearPublicTransport') === 'true'
  const nearHealthServices = formData.get('nearHealthServices') === 'true'
  const nearSchools = formData.get('nearSchools') === 'true'
  const notes = formData.get('notes') as string

  const unit = await prisma.housingUnit.create({
    data: {
      code,
      address,
      totalBeds,
      totalRooms,
      sharedRooms,
      privateRooms,
      sharedBathrooms,
      privateBathrooms,
      sharedKitchen,
      privateKitchen,
      groundFloor,
      wheelchairAccess,
      elevator,
      smokingAllowed,
      petsAllowed,
      quietHours: quietHours || null,
      nearPublicTransport,
      nearHealthServices,
      nearSchools,
      notes: notes || null,
      status: 'AVAILABLE',
    },
  })

  redirect(`/housing/${unit.id}`)
}

export default function NewHousingPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/housing"
          className="text-aoz-primary hover:underline text-sm"
        >
          ← Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Neue Unterkunft
        </h1>
        <p className="text-gray-500">
          Erfassen Sie eine neue Unterkunft im System
        </p>
      </div>

      <form action={createHousingUnit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Grunddaten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Code / Referenz *</label>
              <input
                type="text"
                name="code"
                required
                placeholder="z.B. U-2024-001"
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Adresse *</label>
              <input
                type="text"
                name="address"
                required
                placeholder="Strasse und Hausnummer, PLZ Ort"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Kapazität
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Betten gesamt *</label>
              <input
                type="number"
                name="totalBeds"
                required
                min="1"
                defaultValue="4"
                className="input"
              />
            </div>
            <div>
              <label className="label">Zimmer gesamt *</label>
              <input
                type="number"
                name="totalRooms"
                required
                min="1"
                defaultValue="2"
                className="input"
              />
            </div>
            <div>
              <label className="label">Mehrbettzimmer</label>
              <input
                type="number"
                name="sharedRooms"
                min="0"
                defaultValue="1"
                className="input"
              />
            </div>
            <div>
              <label className="label">Einzelzimmer</label>
              <input
                type="number"
                name="privateRooms"
                min="0"
                defaultValue="1"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Facilities */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ausstattung
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="label">Geteilte Bäder</label>
              <input
                type="number"
                name="sharedBathrooms"
                min="0"
                defaultValue="1"
                className="input"
              />
            </div>
            <div>
              <label className="label">Private Bäder</label>
              <input
                type="number"
                name="privateBathrooms"
                min="0"
                defaultValue="0"
                className="input"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="sharedKitchen"
                value="true"
                defaultChecked
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Geteilte Küche</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="privateKitchen"
                value="true"
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Private Küche</span>
            </label>
          </div>
        </div>

        {/* Accessibility */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Barrierefreiheit
          </h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="groundFloor"
                value="true"
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Erdgeschoss</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="elevator"
                value="true"
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Lift vorhanden</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="wheelchairAccess"
                value="true"
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Rollstuhlgerecht</span>
            </label>
          </div>
        </div>

        {/* House Rules */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hausregeln
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="smokingAllowed"
                  value="true"
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Rauchen erlaubt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="petsAllowed"
                  value="true"
                  className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
                />
                <span className="text-sm text-gray-700">Haustiere erlaubt</span>
              </label>
            </div>
            <div>
              <label className="label">Ruhezeiten</label>
              <input
                type="text"
                name="quietHours"
                placeholder="z.B. 22:00-07:00"
                className="input max-w-xs"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lage</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="nearPublicTransport"
                value="true"
                defaultChecked
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">ÖV in der Nähe</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="nearHealthServices"
                value="true"
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">
                Gesundheitsdienste in der Nähe
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="nearSchools"
                value="true"
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Schulen in der Nähe</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notizen</h2>
          <textarea
            name="notes"
            rows={4}
            placeholder="Zusätzliche Informationen zur Unterkunft..."
            className="input"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button type="submit" className="btn-primary">
            Unterkunft erstellen
          </button>
          <Link href="/housing" className="btn-outline">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  )
}
