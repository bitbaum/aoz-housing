import { SkeletonText } from '@/components/ui/Skeleton'

export default function HelpLoading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse space-y-6">
      <SkeletonText className="h-4 w-32" />
      <SkeletonText className="h-8 w-32" />
      <SkeletonText className="h-4 w-72" />
      <div className="card space-y-3">
        {[1, 2, 3, 4].map(i => (
          <SkeletonText key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}
