export default function TransferLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>

      {/* Form card */}
      <div className="card space-y-6">
        {/* Current unit info */}
        <div className="p-3 bg-gray-50 rounded-lg space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-28" />
          <div className="h-5 bg-gray-200 rounded w-48" />
        </div>

        {/* Reason textarea */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-28 bg-gray-200 rounded-lg" />
        </div>

        {/* Target unit select */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-11 bg-gray-200 rounded-lg" />
        </div>

        {/* Submit button */}
        <div className="h-11 bg-gray-200 rounded-md" />
      </div>
    </div>
  )
}
