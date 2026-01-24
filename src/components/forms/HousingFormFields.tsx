interface HousingFormFieldsProps {
  defaultValues?: {
    code?: string
    buildingName?: string | null
    address?: string
    totalBeds?: number
    totalRooms?: number
    sharedRooms?: number
    privateRooms?: number
    sharedBathrooms?: number
    privateBathrooms?: number
    sharedKitchen?: boolean
    privateKitchen?: boolean
    groundFloor?: boolean
    wheelchairAccess?: boolean
    elevator?: boolean
    smokingAllowed?: boolean
    petsAllowed?: boolean
    quietHours?: string | null
    nearPublicTransport?: boolean
    nearHealthServices?: boolean
    nearSchools?: boolean
    notes?: string | null
  }
  isEdit?: boolean
}

export function HousingFormFields({ defaultValues = {}, isEdit = false }: HousingFormFieldsProps) {
  return (
    <>
      {/* Basic Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grunddaten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Code / Referenz *</label>
            <input
              type="text"
              name="code"
              required
              defaultValue={defaultValues.code}
              placeholder="z.B. U-2024-001"
              className="input"
              readOnly={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-gray-400 mt-1">Code kann nicht geändert werden</p>
            )}
          </div>
          <div>
            <label className="label">Gebäude / Building</label>
            <input
              type="text"
              name="buildingName"
              defaultValue={defaultValues.buildingName || ''}
              placeholder="z.B. Witikon, Zentrum"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Name des Gebäudes oder Standorts</p>
          </div>
          <div className="md:col-span-2">
            <label className="label">Adresse *</label>
            <input
              type="text"
              name="address"
              required
              defaultValue={defaultValues.address}
              placeholder="Strasse und Hausnummer, PLZ Ort"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Capacity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kapazität</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Betten gesamt *</label>
            <input
              type="number"
              name="totalBeds"
              required
              min="1"
              defaultValue={defaultValues.totalBeds ?? 4}
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
              defaultValue={defaultValues.totalRooms ?? 2}
              className="input"
            />
          </div>
          <div>
            <label className="label">Mehrbettzimmer</label>
            <input
              type="number"
              name="sharedRooms"
              min="0"
              defaultValue={defaultValues.sharedRooms ?? 1}
              className="input"
            />
          </div>
          <div>
            <label className="label">Einzelzimmer</label>
            <input
              type="number"
              name="privateRooms"
              min="0"
              defaultValue={defaultValues.privateRooms ?? 1}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ausstattung</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="label">Geteilte Bäder</label>
            <input
              type="number"
              name="sharedBathrooms"
              min="0"
              defaultValue={defaultValues.sharedBathrooms ?? 1}
              className="input"
            />
          </div>
          <div>
            <label className="label">Private Bäder</label>
            <input
              type="number"
              name="privateBathrooms"
              min="0"
              defaultValue={defaultValues.privateBathrooms ?? 0}
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
              defaultChecked={defaultValues.sharedKitchen ?? true}
              className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
            />
            <span className="text-sm text-gray-700">Geteilte Küche</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="privateKitchen"
              value="true"
              defaultChecked={defaultValues.privateKitchen}
              className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
            />
            <span className="text-sm text-gray-700">Private Küche</span>
          </label>
        </div>
      </div>

      {/* Accessibility */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Barrierefreiheit</h2>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="groundFloor"
              value="true"
              defaultChecked={defaultValues.groundFloor}
              className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
            />
            <span className="text-sm text-gray-700">Erdgeschoss</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="elevator"
              value="true"
              defaultChecked={defaultValues.elevator}
              className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
            />
            <span className="text-sm text-gray-700">Lift vorhanden</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="wheelchairAccess"
              value="true"
              defaultChecked={defaultValues.wheelchairAccess}
              className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
            />
            <span className="text-sm text-gray-700">Rollstuhlgerecht</span>
          </label>
        </div>
      </div>

      {/* House Rules */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hausregeln</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="smokingAllowed"
                value="true"
                defaultChecked={defaultValues.smokingAllowed}
                className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
              />
              <span className="text-sm text-gray-700">Rauchen erlaubt</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="petsAllowed"
                value="true"
                defaultChecked={defaultValues.petsAllowed}
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
              defaultValue={defaultValues.quietHours || ''}
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
              defaultChecked={defaultValues.nearPublicTransport ?? true}
              className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
            />
            <span className="text-sm text-gray-700">ÖV in der Nähe</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="nearHealthServices"
              value="true"
              defaultChecked={defaultValues.nearHealthServices}
              className="w-5 h-5 rounded border-gray-300 text-aoz-primary focus:ring-aoz-primary"
            />
            <span className="text-sm text-gray-700">Gesundheitsdienste in der Nähe</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="nearSchools"
              value="true"
              defaultChecked={defaultValues.nearSchools}
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
          defaultValue={defaultValues.notes || ''}
          placeholder="Zusätzliche Informationen zur Unterkunft..."
          className="input"
        />
      </div>
    </>
  )
}
