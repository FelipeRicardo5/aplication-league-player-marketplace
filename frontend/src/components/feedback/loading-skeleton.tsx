import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-100 dark:bg-zinc-800', className)} {...props} />;
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
  bordered = true,
}: {
  rows?: number;
  cols?: number;
  bordered?: boolean;
}) {
  const content = (
    <div className="w-full space-y-3 p-4">
      {/* Table Header Skeleton */}
      <div className="flex gap-4 border-b border-slate-100 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-5',
              i === 0 ? 'w-32' : i === 1 ? 'w-16' : 'flex-1',
            )}
          />
        ))}
      </div>
      {/* Table Rows Skeleton */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-2 border-b border-slate-100/60 last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn(
                'h-7',
                c === 0 ? 'w-36' : c === 1 ? 'w-16' : 'flex-1',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );

  if (bordered) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden my-4">
        {content}
      </div>
    );
  }

  return content;
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-6 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
