interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-xl ${className}`}
    />
  )
}

export function TaskItemSkeleton() {
  return (
    <li className="flex items-center gap-3 rounded-2xl glass-card p-4">
      <Skeleton className="h-6 w-6 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-3 w-12 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>
    </li>
  )
}

export function TaskListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskItemSkeleton key={i} />
      ))}
    </ul>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-4xl space-y-6 animate-pulse">
      {/* Hero Welcome Card Skeleton */}
      <div className="rounded-3xl glass-card p-6 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded-md" />
        <div className="pt-2">
          <Skeleton className="h-4 w-full rounded-full" />
        </div>
      </div>

      {/* Quick Add Bar Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 w-28 rounded-2xl" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl glass-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Task List Section Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <TaskListSkeleton count={3} />
      </div>
    </div>
  )
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl glass-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="max-w-5xl space-y-6">
      <Skeleton className="h-8 w-40 rounded-xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl glass-card p-4 space-y-3">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl glass-card p-6 h-64 flex items-center justify-center">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  )
}
