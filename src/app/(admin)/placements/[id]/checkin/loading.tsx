import { SkeletonPageHeader } from '@/components/ui/Skeleton'

export default function PlacementCheckinLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />

      {/* Resident summary card */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ui-border rounded-md" />
          <div className="space-y-2">
            <div className="h-5 bg-ui-border rounded w-24" />
            <div className="h-4 bg-ui-border rounded w-36" />
          </div>
        </div>
      </div>

      {/* Check-in form */}
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-32" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-ui-border rounded w-24" />
            <div className="h-10 bg-ui-border rounded" />
          </div>
        ))}
        <div className="h-10 bg-ui-border rounded w-40" />
      </div>
    </div>
  )
}
