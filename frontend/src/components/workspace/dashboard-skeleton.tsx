"use client";

export function DashboardSkeleton() {
  return (
    <div className="dashboard-page space-y-6">
      <div className="dashboard-hero stitch-card" aria-hidden="true">
        <div className="space-y-3">
          <div className="shimmer-block h-3 w-28" />
          <div className="shimmer-block h-8 w-56" />
          <div className="shimmer-block h-4 w-72" />
          <div className="shimmer-block h-3 w-40" />
        </div>
        <div className="dashboard-hero__actions">
          <div className="shimmer-block h-9 w-40 rounded-[var(--radius-button)]" />
          <div className="shimmer-block h-9 w-36 rounded-[var(--radius-button)]" />
        </div>
      </div>

      <div className="dashboard-metrics-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="metric-card" aria-hidden="true">
            <div className="shimmer-block h-8 w-8 rounded-[var(--radius-sm)]" />
            <div className="metric-card__content space-y-2">
              <div className="shimmer-block h-6 w-12" />
              <div className="shimmer-block h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-page__split">
        <div className="stitch-card space-y-4" aria-hidden="true">
          <div className="shimmer-block h-4 w-32" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <div className="shimmer-block h-8 w-8 rounded-[var(--radius-sm)]" />
              <div className="flex-1 space-y-2">
                <div className="shimmer-block h-3 w-28" />
                <div className="shimmer-block h-3 w-44" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4" aria-hidden="true">
          <div className="shimmer-block h-4 w-36" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="workspace-card-skeleton stitch-card">
              <div className="shimmer-block h-4 w-[60%]" />
              <div className="mt-3 shimmer-block h-3 w-[80%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
