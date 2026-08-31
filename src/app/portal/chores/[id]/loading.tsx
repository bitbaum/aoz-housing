import { SkeletonText } from '@/components/ui/Skeleton'

export default function ChoreDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonText className="h-7 w-48" />

      {/* Chore detail card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonText className="h-5 w-36" />
          <SkeletonText className="h-6 w-20 rounded-sm" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <SkeletonText className="h-4 w-24 shrink-0" />
              <SkeletonText className="h-4 w-40" />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <SkeletonText className="h-4 w-24" />
          <SkeletonText className="h-16 w-full" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <SkeletonText className="h-11 w-32" />
        <SkeletonText className="h-11 w-28" />
      </div>
    </div>
  )
}
