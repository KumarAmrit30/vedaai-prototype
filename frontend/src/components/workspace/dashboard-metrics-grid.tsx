"use client";

import type { LucideIcon } from "lucide-react";
import {
  Download,
  FileStack,
  Hash,
  Sparkles,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
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
      label: "Exportable Papers",
      value: String(metrics.exportablePapers),
      hint: "Completed papers ready to export",
      icon: Download,
    },
    {
      label: "Remaining Lifetime Generations",
      value:
        metrics.remainingCredits === null
          ? "Unlimited"
          : String(metrics.remainingCredits),
      hint:
        metrics.remainingCredits === null
          ? "Unlimited on paid plans"
          : "Lifetime quota on your current plan",
      icon: FileStack,
    },
  ];

  return (
    <section className="dashboard-metrics-grid" aria-label="Dashboard metrics">
      {cards.map((card) => (
        <MetricCard
          key={card.label}
          label={card.label}
          value={card.value}
          hint={card.hint}
          icon={card.icon}
          className="dashboard-metric-card"
        />
      ))}
    </section>
  );
}
