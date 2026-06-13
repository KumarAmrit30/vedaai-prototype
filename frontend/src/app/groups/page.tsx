"use client";

import {
  Building2,
  GitPullRequest,
  Share2,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { useShellNavigation } from "@/hooks/use-shell-navigation";

const FEATURE_CARDS = [
  {
    title: "Department Workspace",
    description: "Organize exams by faculty, semester, and course code.",
    icon: Building2,
  },
  {
    title: "Faculty Collaboration",
    description: "Co-create papers with shared drafts and review comments.",
    icon: UsersRound,
  },
  {
    title: "Shared Question Banks",
    description: "Publish vetted items once, reuse across every section.",
    icon: Share2,
  },
  {
    title: "Review Workflow",
    description: "Route papers through HOD approval before export.",
    icon: GitPullRequest,
  },
];

const ROADMAP_BENEFITS = [
  "Department workspaces",
  "Faculty collaboration",
  "Shared question banks",
  "Review workflows",
];

export default function GroupsPage() {
  const { handleNavigate, navigateToCreate, comingSoon } = useShellNavigation();

  return (
    <AppShell
      title="Groups"
      subtitle="Department workspaces and faculty collaboration"
      activeNav="groups"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <section className="feature-preview-hero">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[32px]">
              Department Groups
            </h1>
            <ComingSoonBadge />
          </div>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Give every department a shared workspace — collaborate on papers,
            question banks, and review workflows without leaving ExamForge AI.
          </p>
        </section>

        <div className="feature-preview-grid">
          {FEATURE_CARDS.map((card) => (
            <article key={card.title} className="feature-preview-card">
              <div className="metric-card__icon mb-3">
                <card.icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
                {card.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {card.description}
              </p>
            </article>
          ))}
        </div>

        <section className="roadmap-panel">
          <h2 className="font-display text-[18px] font-semibold text-[var(--text-primary)]">
            Planned capabilities
          </h2>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Groups are in preview. Department lists, member counts, and activity
            metrics will appear here after launch — none are shown until the
            feature is live.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {ROADMAP_BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                {benefit}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
