"use client";

import { useRouter } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { PageTransition } from "@/components/layout/page-transition";
import { DashboardActivityFeed } from "@/components/workspace/dashboard-activity-feed";
import { DashboardEmptyState } from "@/components/workspace/dashboard-empty-state";
import { DashboardHero } from "@/components/workspace/dashboard-hero";
import { DashboardMetricsGrid } from "@/components/workspace/dashboard-metrics-grid";
import { DashboardQuickActions } from "@/components/workspace/dashboard-quick-actions";
import { DashboardRecentAssignments } from "@/components/workspace/dashboard-recent-assignments";
import { DashboardSkeleton } from "@/components/workspace/dashboard-skeleton";
import {
  buildActivityTimeline,
  computeAssignmentStatistics,
  computeDashboardMetrics,
  computeUsageAnalytics,
  getRecentAssignments,
} from "@/lib/utils/dashboard-analytics";
import { formatDashboardUsageLabel } from "@/lib/utils/usage-label";
import { useAssignmentStore } from "@/store/assignment.store";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";

function GuestDashboard(): React.ReactNode {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="dashboard-page space-y-6">
        <section className="dashboard-hero stitch-card">
          <div>
            <p className="dashboard-hero__eyebrow">ExamForge AI</p>
            <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
              Educator workspace
            </h1>
            <p className="mt-2 max-w-xl text-[14px] text-[var(--text-secondary)]">
              Sign in to generate assessments, export PDFs, and manage your
              exam library.
            </p>
          </div>
        </section>

        <section className="dashboard-empty-state stitch-card">
          <div className="dashboard-empty-state__illustration">
            <Sparkles className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.75} />
          </div>
          <h3 className="font-display text-[18px] font-semibold text-[var(--text-primary)]">
            Welcome to ExamForge AI
          </h3>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Sign in to generate assignments, answer keys, and downloadable PDFs.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login?next=/")}
            className="submit-pill-btn mt-6"
          >
            <LogIn className="h-3.5 w-3.5" strokeWidth={2.5} />
            Continue with Google
          </button>
        </section>
      </div>
    </PageTransition>
  );
}

interface HomeDashboardProps {
  loading: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onCreateClick?: () => void;
}

export function HomeDashboard({
  loading,
  loadError = null,
  onRetry,
  onCreateClick,
}: HomeDashboardProps) {
  const assignments = useAssignmentStore((state) => state.assignments);
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const billingProfile = useUserStore((state) => state.billingProfile);

  const assignmentStats = computeAssignmentStatistics(assignments);

  const usageAnalytics = computeUsageAnalytics({
    assignmentsGenerated:
      billingProfile?.usage.assignmentsGenerated ??
      profile?.usage.assignmentsGenerated ??
      0,
    assignmentsAllowed:
      billingProfile?.limits.assignmentsAllowed ??
      profile?.limits.assignmentsAllowed ??
      null,
  });

  const dashboardMetrics = computeDashboardMetrics(assignments, usageAnalytics);
  const activityEvents = buildActivityTimeline(assignments);
  const recentAssignments = getRecentAssignments(assignments);

  if (authStatus === "loading") {
    return <AuthLoadingScreen />;
  }

  if (authStatus === "unauthenticated") {
    return <GuestDashboard />;
  }

  if (loadError && assignments.length === 0) {
    return (
      <PageTransition>
        <div className="product-state-card stitch-card mx-auto max-w-xl px-6 py-8 text-center">
          <h3 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
            Couldn&apos;t load dashboard
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {loadError}
          </p>
          {onRetry ? (
            <button type="button" onClick={onRetry} className="submit-pill-btn mt-5">
              Try again
            </button>
          ) : null}
        </div>
      </PageTransition>
    );
  }

  if (loading && assignments.length === 0) {
    return (
      <PageTransition>
        <DashboardSkeleton />
      </PageTransition>
    );
  }

  const usageLabel = formatDashboardUsageLabel(
    usageAnalytics.assignmentsGenerated,
    usageAnalytics.assignmentLimit,
  );

  const activityHint =
    assignmentStats.processing > 0
      ? `${assignmentStats.processing} generating now`
      : assignmentStats.completed > 0
        ? `${assignmentStats.completed} ready to review`
        : "";

  return (
    <PageTransition>
      <div className="dashboard-page space-y-6">
        {user ? (
          <DashboardHero
            user={user}
            usageLabel={usageLabel}
            activityHint={activityHint}
            onCreateClick={onCreateClick}
          />
        ) : null}

        <DashboardMetricsGrid metrics={dashboardMetrics} />

        {assignments.length === 0 ? (
          <DashboardEmptyState onCreateClick={onCreateClick} />
        ) : (
          <>
            <div className="dashboard-page__split">
              <DashboardActivityFeed events={activityEvents} />
              <div className="dashboard-page__aside">
                <DashboardRecentAssignments assignments={recentAssignments} />
              </div>
            </div>

            <DashboardQuickActions />
          </>
        )}

        {assignments.length > 0 ? null : (
          <DashboardQuickActions />
        )}
      </div>
    </PageTransition>
  );
}
