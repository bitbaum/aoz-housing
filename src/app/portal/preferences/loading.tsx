import { SkeletonText } from '@/components/ui/Skeleton'

export default function PreferencesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonText className="h-4 w-32" />
      <SkeletonText className="h-8 w-48" />
      <SkeletonText className="h-4 w-64" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card space-y-4">
          <SkeletonText className="h-6 w-32" />
          <SkeletonText className="h-10 w-full" />
          <SkeletonText className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
