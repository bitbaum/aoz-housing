import { SkeletonText } from '@/components/ui/Skeleton'

export default function PortalChoresLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonText className="h-7 w-40" />
      <SkeletonText className="h-4 w-56" />
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <SkeletonText className="h-5 w-32" />
              <SkeletonText className="h-6 w-16 rounded-full" />
            </div>
            <SkeletonText className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}
