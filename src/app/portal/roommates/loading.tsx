import { SkeletonText, SkeletonCircle } from '@/components/ui/Skeleton'

export default function RoommatesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonText className="h-4 w-32" />
      <SkeletonText className="h-8 w-48" />
      <SkeletonText className="h-4 w-64" />
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="card">
            <div className="flex items-start gap-4">
              <SkeletonCircle className="w-16 h-16" />
              <div className="flex-1 space-y-3">
                <SkeletonText className="h-5 w-24" />
                <SkeletonText className="h-4 w-16" />
                <div className="flex gap-2">
                  {[1, 2, 3].map(j => (
                    <SkeletonText key={j} className="h-6 w-20 rounded-sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
