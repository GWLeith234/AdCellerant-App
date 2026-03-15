"use client";

function DealCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg border-l-[3px] border-l-transparent animate-pulse">
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 bg-navy/80 rounded w-3/5" />
          <div className="h-4 bg-navy/80 rounded w-12" />
        </div>
        <div className="h-3 bg-navy/80 rounded w-2/5" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-navy/80 rounded w-16" />
          <div className="h-4 bg-navy/80 rounded-full w-8" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-navy/80 rounded w-20" />
          <div className="h-3 bg-navy/80 rounded w-14 ml-auto" />
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-navy/80" />
          ))}
        </div>
      </div>
      <div className="border-t border-border px-3.5 py-2 flex items-center justify-between">
        <div className="h-3 bg-navy/80 rounded w-24" />
        <div className="h-5 bg-navy/80 rounded w-6" />
      </div>
    </div>
  );
}

interface DealGridSkeletonProps {
  count?: number;
  columns?: 3 | 4;
}

export default function DealGridSkeleton({ count = 8, columns = 4 }: DealGridSkeletonProps) {
  const gridCls =
    columns === 3
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3";

  return (
    <div className={gridCls}>
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}
