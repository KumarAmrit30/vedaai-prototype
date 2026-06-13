"use client";

export function AssignmentCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <article
      className="workspace-card-skeleton stitch-card"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="shimmer-block h-5 w-[55%]" />
          <div className="shimmer-block h-3 w-[35%]" />
          <div className="shimmer-block h-3 w-[70%]" />
        </div>
        <div className="shimmer-block h-5 w-16 rounded-[var(--radius-sm)]" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="shimmer-block h-8 w-16 rounded-[var(--radius-sm)]" />
        <div className="shimmer-block h-8 w-20 rounded-[var(--radius-sm)]" />
        <div className="shimmer-block h-8 w-24 rounded-[var(--radius-sm)]" />
      </div>
    </article>
  );
}

export function AssignmentListSkeleton() {
  return (
    <div className="workspace-assignment-list">
      {Array.from({ length: 5 }).map((_, index) => (
        <AssignmentCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

export function WorkspaceStatsSkeleton() {
  return (
    <div className="workspace-stats-bar">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="workspace-stats-bar__item" aria-hidden="true">
          <div className="shimmer-block h-7 w-10" />
          <div className="mt-2 shimmer-block h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
