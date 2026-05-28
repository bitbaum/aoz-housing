import { SkeletonText } from '@/components/ui/Skeleton'

export default function PortalHousingLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonText className="h-7 w-52" />
      <SkeletonText className="h-4 w-64" />

      {/* Housing unit cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <SkeletonText className="h-5 w-36" />
                <SkeletonText className="h-4 w-48" />
              </div>
              <SkeletonText className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-4">
              <SkeletonText className="h-4 w-24" />
              <SkeletonText className="h-4 w-24" />
            </div>
            <SkeletonText className="h-11 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
