import { SkeletonPageHeader } from '@/components/ui/Skeleton'

export default function HousingSpotsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />

      {/* Spots grid */}
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-16 bg-ui-border rounded-lg" />
          ))}
        </div>
      </div>

      {/* Spot management actions */}
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-40" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-12 bg-ui-border rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
