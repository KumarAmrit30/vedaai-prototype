"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Layers,
  ListChecks,
  LogIn,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { PageTransition } from "@/components/layout/page-transition";
import { PlanBadge } from "@/components/ui/plan-badge";
import { ROUTES } from "@/lib/navigation/routes";
import {
  computeAssignmentStatistics,
  computePlanAnalytics,
  computeUsageAnalytics,
} from "@/lib/utils/dashboard-analytics";
import { useAssignmentStore } from "@/store/assignment.store";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";

function GuestDashboard(): React.ReactNode {
  const router = useRouter();

  return (
    <PageTransition>
      <div className="home-dashboard space-y-5">
        <section className="home-dashboard__hero surface-card-compact">
          <p className="home-dashboard__eyebrow">ExamForge AI</p>
          <h1 className="home-dashboard__title">Dashboard</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Your assessment workspace — sign in to start generating.
          </p>
        </section>

        <section className="empty-state-card surface-card-compact mx-auto max-w-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-[var(--border-light)] bg-[var(--surface-muted)]">
            <FileText
              className="h-6 w-6 text-[var(--text-secondary)] opacity-50"
              strokeWidth={1.75}
            />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
            Welcome to ExamForge AI
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Sign in to generate assignments, answer keys, and downloadable PDFs.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login?next=/")}
            className="submit-pill-btn mt-5"
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
}

function AnalyticsStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="home-stat-card surface-card-compact">
      <p className="home-stat-card__label">{label}</p>
      <p className="home-stat-card__value">{value}</p>
      <p className="home-stat-card__hint">{hint}</p>
    </div>
  );
}

function DashboardSkeleton(): React.ReactNode {
  return (
    <PageTransition>
      <div className="home-dashboard space-y-5">
        <div className="home-dashboard__hero surface-card-compact">
          <div className="shimmer-block h-5 w-40" />
          <div className="mt-2 shimmer-block h-3 w-64" />
        </div>
        <section className="home-dashboard__analytics-row">
          {[1, 2].map((key) => (
            <div key={key} className="surface-card-compact p-4" aria-hidden="true">
              <div className="shimmer-block h-3 w-24" />
              <div className="mt-3 shimmer-block h-6 w-32" />
              <div className="mt-2 shimmer-block h-3 w-40" />
            </div>
          ))}
        </section>
        <section className="home-dashboard__stats home-dashboard__stats--five">
          {[1, 2, 3, 4, 5].map((key) => (
            <div key={key} className="home-stat-card surface-card-compact" aria-hidden="true">
              <div className="shimmer-block h-3 w-16" />
              <div className="mt-2 shimmer-block h-8 w-10" />
              <div className="mt-1 shimmer-block h-3 w-28" />
            </div>
          ))}
        </section>
      </div>
    </PageTransition>
  );
}

export function HomeDashboard({
  loading,
  loadError = null,
  onRetry,
}: HomeDashboardProps) {
  const assignments = useAssignmentStore((state) => state.assignments);
  const authStatus = useAuthStore((state) => state.status);
  const profile = useUserStore((state) => state.profile);
  const billingProfile = useUserStore((state) => state.billingProfile);

  const assignmentStats = computeAssignmentStatistics(assignments);

  const planAnalytics = computePlanAnalytics({
    plan: billingProfile?.plan ?? profile?.plan,
    subscriptionStatus: billingProfile?.subscription.status,
  });

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

  if (authStatus === "loading") {
    return <AuthLoadingScreen />;
  }

  if (authStatus === "unauthenticated") {
    return <GuestDashboard />;
  }

  if (loadError && assignments.length === 0) {
    return (
      <PageTransition>
        <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
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
    return <DashboardSkeleton />;
  }

  const remainingLabel =
    usageAnalytics.remainingGenerations === null
      ? "Unlimited"
      : String(usageAnalytics.remainingGenerations);

  const limitLabel =
    usageAnalytics.assignmentLimit === null
      ? "Unlimited"
      : String(usageAnalytics.assignmentLimit);

  return (
    <PageTransition>
      <div className="home-dashboard space-y-5">
        <section className="home-dashboard__hero surface-card-compact">
          <p className="home-dashboard__eyebrow">ExamForge AI</p>
          <h1 className="home-dashboard__title">Account analytics</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Plan usage, assignment status breakdown, and shortcuts to your most
            common workflows.
          </p>
        </section>

        <section className="home-dashboard__analytics-row">
          <div className="surface-card-compact p-4 md:p-5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={2} />
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
                Current Plan
              </h2>
            </div>
            <div className="mt-3">
              <PlanBadge plan={planAnalytics.plan} />
            </div>
            <dl className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-[var(--text-muted)]">Plan tier</dt>
                <dd className="font-medium capitalize text-[var(--text-primary)]">
                  {planAnalytics.plan}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-[var(--text-muted)]">Subscription</dt>
                <dd className="font-medium capitalize text-[var(--text-primary)]">
                  {planAnalytics.subscriptionStatus}
                </dd>
              </div>
            </dl>
          </div>

          <div className="surface-card-compact p-4 md:p-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={2} />
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
                Usage
              </h2>
            </div>
            <dl className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-[var(--text-muted)]">Generated</dt>
                <dd className="font-medium text-[var(--text-primary)]">
                  {usageAnalytics.assignmentsGenerated}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-[var(--text-muted)]">Limit</dt>
                <dd className="font-medium text-[var(--text-primary)]">{limitLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-[var(--text-muted)]">Remaining</dt>
                <dd className="font-medium text-[var(--text-primary)]">{remainingLabel}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[13px] font-semibold text-[var(--text-primary)]">
            Assignment statistics
          </h2>
          <div className="home-dashboard__stats home-dashboard__stats--five">
            <AnalyticsStatCard
              label="Total"
              value={assignmentStats.total}
              hint="Assignments in workspace"
            />
            <AnalyticsStatCard
              label="Pending"
              value={assignmentStats.pending}
              hint="Awaiting generation"
            />
            <AnalyticsStatCard
              label="Processing"
              value={assignmentStats.processing}
              hint="Currently generating"
            />
            <AnalyticsStatCard
              label="Completed"
              value={assignmentStats.completed}
              hint="Ready to review"
            />
            <AnalyticsStatCard
              label="Failed"
              value={assignmentStats.failed}
              hint="Needs attention"
            />
          </div>
        </section>

        <section className="surface-card-compact p-4 md:p-5">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
            Quick actions
          </h2>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Jump straight into creation, review, or plan upgrades.
          </p>
          <div className="home-dashboard__actions mt-4">
            <Link href={ROUTES.createAssignment} className="submit-pill-btn">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Create Assignment
            </Link>
            <Link href={ROUTES.assignments} className="outline-pill-btn">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
              View Assignments
            </Link>
            <Link href={ROUTES.upgrade} className="outline-pill-btn">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
              Upgrade Plan
            </Link>
          </div>
        </section>

        {assignments.length === 0 ? (
          <section className="empty-state-card surface-card-compact mx-auto max-w-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-[var(--border-light)] bg-[var(--surface-muted)]">
              <Sparkles
                className="h-6 w-6 text-[var(--text-secondary)] opacity-50"
                strokeWidth={1.75}
              />
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
              Create your first assignment
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Your analytics are ready. Generate an assignment to populate your
              workspace statistics.
            </p>
            <Link href={ROUTES.createAssignment} className="submit-pill-btn mt-5">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              Create Your First Assignment
            </Link>
          </section>
        ) : null}
      </div>
    </PageTransition>
  );
}
