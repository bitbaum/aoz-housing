export default function ReportLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="h-4 bg-gray-200 rounded w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card h-24 bg-gray-200 rounded" />
        <div className="card h-24 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
