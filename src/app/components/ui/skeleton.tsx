import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

// 专属骨架屏：日历网格
function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// 专属骨架屏：地图占位
function MapSkeleton() {
  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-4 p-4 opacity-30">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl" />
        ))}
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
         <Skeleton className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30" />
      </div>
    </div>
  );
}

export { Skeleton, CalendarSkeleton, MapSkeleton };