"use client";

import {
  BookMarked,
  FileStack,
  FolderOpen,
  Layers,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { useShellNavigation } from "@/hooks/use-shell-navigation";

const LIBRARY_SECTIONS = [
  { title: "Syllabus PDFs", count: "24 files", icon: BookMarked },
  { title: "Question Banks", count: "1,240 items", icon: FileStack },
  { title: "Templates", count: "18 patterns", icon: Layers },
  { title: "Previous Year Papers", count: "56 papers", icon: NotebookPen },
  { title: "Notes", count: "92 documents", icon: FolderOpen },
];

const ROADMAP_BENEFITS = [
  "Reusable Content",
  "Team Sharing",
  "Smart Organization",
  "Faster Generation",
];

export default function LibraryPage() {
  const { handleNavigate, navigateToCreate, comingSoon } = useShellNavigation();

  return (
    <AppShell
      title="Resource Library"
      subtitle="Centralized study materials and reusable content"
      activeNav="library"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
        <section className="feature-preview-hero">
          <div className="flex flex-wrap items-center gap-3">
            <div className="solutions-preview__hero-icon">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[32px]">
                  Resource Library
                </h1>
                <ComingSoonBadge />
              </div>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
                Store syllabus PDFs, question banks, templates, and notes in one
                place — then reuse them across every exam you generate.
              </p>
            </div>
          </div>
        </section>

        <div className="feature-preview-grid feature-preview-grid--3">
          {LIBRARY_SECTIONS.map((section) => (
            <article key={section.title} className="feature-preview-card">
              <div className="metric-card__icon mb-3">
                <section.icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
                {section.title}
              </h2>
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                {section.count}
              </p>
            </article>
          ))}
        </div>

        <section className="roadmap-panel">
          <h2 className="font-display text-[18px] font-semibold text-[var(--text-primary)]">
            Roadmap
          </h2>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            The Resource Library is designed to make every generation faster by
            keeping your best content one click away.
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
