import { SkeletonPageHeader } from '@/components/ui/Skeleton'

export default function NewResidentLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />

      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="card p-6 space-y-4">
          <div className="h-5 bg-ui-border rounded w-36" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="space-y-1">
                <div className="h-3 bg-ui-border rounded w-24" />
                <div className="h-10 bg-ui-border rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="h-10 bg-ui-border rounded w-40" />
    </div>
  )
}
