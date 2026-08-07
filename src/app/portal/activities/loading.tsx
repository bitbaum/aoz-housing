import { SkeletonText } from '@/components/ui/Skeleton'

export default function ActivitiesLoading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText className="h-4 w-32" />
        <SkeletonText className="h-8 w-56" />
        <SkeletonText className="h-4 w-72" />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {[80, 110, 95, 120, 90].map((w, i) => (
          <div key={i} className="h-9 bg-ui-border rounded-sm" style={{ width: w }} />
        ))}
      </div>

      {/* Activity cards */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center justify-between">
              <SkeletonText className="h-5 w-40" />
              <SkeletonText className="h-5 w-16 rounded-sm" />
            </div>
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-3/4" />
            <div className="flex gap-4">
              <SkeletonText className="h-3 w-24" />
              <SkeletonText className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
