import { SkeletonText } from '@/components/ui/Skeleton'

export default function NewChoreLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonText className="h-7 w-40" />

      {/* Create chore form card */}
      <div className="card p-6 space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-1">
            <SkeletonText className="h-4 w-28" />
            <SkeletonText className="h-11 w-full" />
          </div>
        ))}
        <div className="space-y-1">
          <SkeletonText className="h-4 w-24" />
          <SkeletonText className="h-20 w-full" />
        </div>
        <SkeletonText className="h-11 w-36" />
      </div>
    </div>
  )
}
