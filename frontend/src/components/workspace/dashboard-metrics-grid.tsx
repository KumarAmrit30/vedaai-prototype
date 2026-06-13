"use client";

import type { LucideIcon } from "lucide-react";
import {
  Download,
  FileStack,
  Hash,
  Sparkles,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/utils/dashboard-analytics";

interface DashboardMetricsGridProps {
  metrics: DashboardMetrics;
}

interface MetricConfig {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

export function DashboardMetricsGrid({ metrics }: DashboardMetricsGridProps) {
  const cards: MetricConfig[] = [
    {
      label: "Assignments Generated",
      value: String(metrics.assignmentsGenerated),
      hint: "Lifetime total",
      icon: Sparkles,
    },
    {
      label: "Questions Generated",
      value: String(metrics.questionsGenerated),
      hint: "Across completed papers",
      icon: Hash,
    },
    {
      label: "PDF Exports",
      value: String(metrics.pdfExports),
      hint: "Ready to download",
      icon: Download,
    },
    {
      label: "Remaining Monthly Credits",
      value:
        metrics.remainingCredits === null
          ? "Unlimited"
          : String(metrics.remainingCredits),
      hint:
        metrics.remainingCredits === null
          ? "Pro plan"
          : "This billing period",
      icon: FileStack,
    },
  ];

  return (
    <section className="dashboard-metrics-grid" aria-label="Dashboard metrics">
      {cards.map((card) => (
        <article key={card.label} className="metric-card dashboard-metric-card">
          <div className="metric-card__icon">
            <card.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="metric-card__content">
            <span className="metric-card__value">{card.value}</span>
            <span className="metric-card__label">{card.label}</span>
            {card.hint ? (
              <span className="dashboard-metric-card__hint">{card.hint}</span>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
