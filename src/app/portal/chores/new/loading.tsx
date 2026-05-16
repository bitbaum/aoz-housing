export default function NewChoreLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 bg-gray-200 rounded w-40" />

      {/* Create chore form card */}
      <div className="card p-6 space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="h-11 bg-gray-200 rounded" />
          </div>
        ))}
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
        <div className="h-11 bg-gray-200 rounded w-36" />
      </div>
    </div>
  )
}
