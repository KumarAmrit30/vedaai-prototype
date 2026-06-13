"use client";

import type { WorkspaceStats } from "@/lib/utils/dashboard-analytics";

interface WorkspaceStatsBarProps {
  stats: WorkspaceStats;
}

export function WorkspaceStatsBar({ stats }: WorkspaceStatsBarProps) {
  const items = [
    { label: "Total Assignments", value: stats.total },
    { label: "Generated This Month", value: stats.generatedThisMonth },
    { label: "Drafts", value: stats.drafts },
    { label: "Completed", value: stats.completed },
  ];

  return (
    <section className="workspace-stats-bar" aria-label="Workspace statistics">
      {items.map((item) => (
        <article key={item.label} className="workspace-stats-bar__item">
          <span className="workspace-stats-bar__value">{item.value}</span>
          <span className="workspace-stats-bar__label">{item.label}</span>
        </article>
      ))}
    </section>
  );
}
