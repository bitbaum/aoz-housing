import { SkeletonPageHeader } from '@/components/ui/Skeleton'

export default function AlgorithmLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />
      <div className="card p-6 space-y-4">
        <div className="h-5 bg-ui-border rounded w-40" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 bg-ui-border rounded w-32" />
            <div className="flex-1 h-3 bg-ui-border rounded" />
            <div className="h-4 bg-ui-border rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
