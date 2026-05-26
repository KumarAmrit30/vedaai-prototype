"use client";

interface AssignmentCardSkeletonProps {
  index?: number;
}

export function AssignmentCardSkeleton({ index = 0 }: AssignmentCardSkeletonProps) {
  return (
    <article
      className="assignment-card assignment-card-skeleton flow-step-panel"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="shimmer-block h-4 w-[68%]" />
          <div className="shimmer-block h-3 w-[45%]" />
        </div>
        <div className="shimmer-block h-5 w-16 rounded-full" />
      </div>
      <div className="assignment-card__footer">
        <div className="flex gap-3">
          <div className="shimmer-block h-3 w-20" />
          <div className="shimmer-block h-3 w-24" />
        </div>
        <div className="shimmer-block h-7 w-7 rounded-full" />
      </div>
    </article>
  );
}

export function AssignmentListSkeleton() {
  return (
    <div className="assignment-list-container grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <AssignmentCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}
