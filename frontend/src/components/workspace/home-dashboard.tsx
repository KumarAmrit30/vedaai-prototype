"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";
import { AssignmentCard } from "@/components/assignment/AssignmentCard";
import { AssignmentListSkeleton } from "@/components/assignment/assignment-card-skeleton";
import { PageTransition } from "@/components/layout/page-transition";
import { useDashboardStats } from "@/hooks/use-assignments-loader";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ROUTES } from "@/lib/navigation/routes";
import {
  getPendingAssignmentsSnapshot,
  getRecentlyOpenedAssignments,
} from "@/lib/utils/dashboard-assignments";
import { useAssignmentStore } from "@/store/assignment.store";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import type { Assignment } from "@/types/assignment";

const GUEST_FEATURES = [
  "AI-generated assessments",
  "Automatic answer keys",
  "PDF export",
  "Google Sign-In",
  "Fast generation",
];

function GuestDashboard() {
  const requireAuth = useRequireAuth();

  return (
    <PageTransition>
      <div className="home-dashboard space-y-5">
        <section className="home-dashboard__hero surface-card-compact">
          <p className="home-dashboard__eyebrow">ExamForge AI</p>
          <h1 className="home-dashboard__title mt-1 max-w-2xl text-balance text-[24px] leading-tight sm:text-[28px]">
            Generate professional assessments in seconds
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Create AI-powered assignments, answer keys, and export-ready papers.
          </p>

          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {GUEST_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-[var(--orange-primary)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <button
              type="button"
              onClick={() =>
                requireAuth(undefined, { next: ROUTES.createAssignment })
              }
              className="submit-pill-btn"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              Create Your First Assignment
            </button>
          </div>
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

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
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

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="home-section-header">
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      {href && linkLabel ? (
        <Link href={href} className="home-section-header__link">
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyHomeCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="home-empty-card surface-card-compact">
      <p className="text-[13px] font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

function RecentCards({ assignments }: { assignments: Assignment[] }) {
  const recentlyOpenedHighlightId = useWorkspaceStore(
    (state) => state.recentlyOpenedHighlightId,
  );

  return (
    <div className="home-recent-grid">
      {assignments.map((assignment, index) => (
        <AssignmentCard
          key={assignment._id}
          assignment={assignment}
          index={index}
          isRecentlyOpened={recentlyOpenedHighlightId === assignment._id || index === 0}
        />
      ))}
    </div>
  );
}

export function HomeDashboard({
  loading,
  loadError = null,
  onRetry,
}: HomeDashboardProps) {
  const assignments = useAssignmentStore((state) => state.assignments);
  const authStatus = useAuthStore((state) => state.status);
  const stats = useDashboardStats(assignments);

  const recentlyOpened = getRecentlyOpenedAssignments(assignments, 5);
  const pendingSnapshot = getPendingAssignmentsSnapshot(assignments, 4);

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
    return (
      <PageTransition>
        <div className="home-dashboard space-y-5">
          <div className="home-dashboard__hero surface-card-compact">
            <div className="shimmer-block h-5 w-40" />
            <div className="mt-2 shimmer-block h-3 w-64" />
          </div>
          <AssignmentListSkeleton />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="home-dashboard space-y-5">
        <section className="home-dashboard__hero surface-card-compact">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="home-dashboard__eyebrow">ExamForge AI</p>
              <h1 className="home-dashboard__title">Your assessment overview</h1>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Pick up where you left off, monitor pending generation, and jump into your full workspace when you need to manage assignments at scale.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={ROUTES.assignments} className="outline-pill-btn">
                View All Assignments
              </Link>
              <Link href={ROUTES.createAssignment} className="submit-pill-btn">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Create Assignment
              </Link>
            </div>
          </div>
        </section>

        <section className="home-dashboard__stats">
          <StatCard label="Total" value={stats.total} hint="Assignments in workspace" />
          <StatCard label="Pending" value={stats.pending} hint="Generating or awaiting paper" />
          <StatCard label="Completed" value={stats.completed} hint="Ready to review and export" />
        </section>

        <section className="home-dashboard__section">
          <SectionHeader
            title="Recently Opened"
            subtitle="Last 5 assignments you viewed"
            href={ROUTES.assignments}
            linkLabel="Open workspace"
          />
          {recentlyOpened.length > 0 ? (
            <RecentCards assignments={recentlyOpened} />
          ) : (
            <EmptyHomeCard
              title="No recent activity yet"
              description="Open an assignment to see it appear here for quick access."
            />
          )}
        </section>

        <section className="home-dashboard__section">
          <SectionHeader
            title="Pending Assignments"
            subtitle="Snapshots of work still in progress"
            href={ROUTES.assignments}
            linkLabel="Manage all"
          />
          {pendingSnapshot.length > 0 ? (
            <div className="home-pending-list">
              {pendingSnapshot.map((assignment) => (
                <Link
                  key={assignment._id}
                  href={ROUTES.assignmentDetail(assignment._id)}
                  className="home-pending-item surface-card-compact"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                      {assignment.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">
                      {assignment.topic}
                    </p>
                  </div>
                  <span className="home-pending-item__status">
                    <Clock3 className="h-3 w-3" strokeWidth={2} />
                    Pending
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyHomeCard
              title="Nothing pending right now"
              description="Completed assignments and new drafts will show up here when action is needed."
            />
          )}
        </section>

        {assignments.length === 0 ? (
          <section className="empty-state-card surface-card-compact mx-auto">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-[var(--border-light)] bg-[var(--surface-muted)]">
              <FileText className="h-6 w-6 text-[var(--text-secondary)] opacity-50" strokeWidth={1.75} />
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
              Start your first assessment
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Create an AI-generated assignment to populate your dashboard and workspace.
            </p>
            <Link href={ROUTES.createAssignment} className="submit-pill-btn mt-5">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              Create Assignment
            </Link>
          </section>
        ) : null}
      </div>
    </PageTransition>
  );
}
