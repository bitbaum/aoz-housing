import { SkeletonPageHeader, SkeletonRow, SkeletonRowList } from '@/components/ui/Skeleton'

export default function IncidentDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />

      {/* Two-column layout: main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: incident description + timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>

          {/* Follow-up timeline */}
          <div className="card p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-40" />
            <SkeletonRowList count={3} />
          </div>
        </div>

        {/* Sidebar: metadata */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-5 bg-gray-200 rounded w-28" />
              </div>
            ))}
          </div>
          <div className="card p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <SkeletonRow />
          </div>
        </div>
      </div>
    </div>
  )
}
