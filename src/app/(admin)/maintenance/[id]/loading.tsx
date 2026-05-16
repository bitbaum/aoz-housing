import { SkeletonPageHeader } from '@/components/ui/Skeleton'

export default function MaintenanceDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <SkeletonPageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-36" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
            </div>
          </div>

          {/* Status update form */}
          <div className="card p-6 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-40" />
            <div className="h-10 bg-gray-200 rounded w-full" />
            <div className="h-24 bg-gray-200 rounded w-full" />
            <div className="h-10 bg-gray-200 rounded w-32" />
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="card p-4 space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-5 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
