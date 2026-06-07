"use client";

import { AssignmentListSkeleton } from "@/components/assignment/assignment-card-skeleton";
import { PageTransition } from "@/components/layout/page-transition";

function StatCardSkeleton(): React.ReactNode {
  return (
    <div className="home-stat-card surface-card-compact" aria-hidden="true">
      <div className="shimmer-block h-3 w-16" />
      <div className="mt-2 shimmer-block h-8 w-10" />
      <div className="mt-1 shimmer-block h-3 w-28" />
    </div>
  );
}

/**
 * Neutral dashboard placeholder shown while Firebase auth hydrates.
 * Avoids flashing guest or authenticated content before session is known.
 */
export function AuthLoadingScreen(): React.ReactNode {
  return (
    <PageTransition>
      <div
        className="home-dashboard space-y-5"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <section className="home-dashboard__hero surface-card-compact">
          <div className="shimmer-block h-4 w-28" />
          <div className="mt-2 shimmer-block h-6 w-56" />
          <div className="mt-2 shimmer-block h-3 w-full max-w-md" />
        </section>

        <section className="home-dashboard__stats">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </section>

        <AssignmentListSkeleton />
      </div>
    </PageTransition>
  );
}
