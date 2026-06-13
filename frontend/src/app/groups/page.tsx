"use client";

import {
  Building2,
  GitPullRequest,
  Share2,
  Users,
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

const DEPARTMENTS = [
  { name: "Computer Science", members: 12, papers: 48 },
  { name: "Physics", members: 8, papers: 31 },
  { name: "Chemistry", members: 9, papers: 27 },
  { name: "Mathematics", members: 10, papers: 36 },
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

          <div className="stat-preview-grid mt-8">
            <div className="stat-preview-card">
              <strong>39</strong>
              <span>Faculty members</span>
            </div>
            <div className="stat-preview-card">
              <strong>142</strong>
              <span>Shared papers</span>
            </div>
            <div className="stat-preview-card">
              <strong>4</strong>
              <span>Departments</span>
            </div>
            <div className="stat-preview-card">
              <strong>18</strong>
              <span>Pending reviews</span>
            </div>
          </div>
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

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--text-secondary)]" />
            <h2 className="font-display text-[16px] font-semibold text-[var(--text-primary)]">
              Departments
            </h2>
          </div>
          <div className="grid gap-3">
            {DEPARTMENTS.map((dept) => (
              <article key={dept.name} className="department-card">
                <div>
                  <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
                    {dept.name}
                  </h3>
                  <p className="department-card__meta mt-1">
                    {dept.members} members · {dept.papers} shared papers
                  </p>
                </div>
                <ComingSoonBadge compact />
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
