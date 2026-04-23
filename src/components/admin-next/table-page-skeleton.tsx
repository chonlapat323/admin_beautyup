import { Skeleton } from "@/components/ui/skeleton";

export function TablePageSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-[20px] border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Filters */}
      <div className="mb-5 flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-2xl" />
        <Skeleton className="h-11 w-44 rounded-2xl" />
        <Skeleton className="h-11 w-32 rounded-2xl" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
        {/* Header row */}
        <div className="flex gap-4 bg-[#f8fbf9] px-5 py-4 dark:bg-dark-2">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-stroke px-5 py-4 dark:border-dark-3">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                className={`h-4 flex-1 ${j === 0 ? "max-w-[80px]" : j === cols - 1 ? "max-w-[120px]" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-5 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
