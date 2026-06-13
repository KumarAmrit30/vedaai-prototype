"use client";

import { FileText, Sparkles, Timer, Zap } from "lucide-react";
import {
  computeCompressionSavings,
  estimateMaterialPages,
  formatDurationMs,
} from "@/lib/utils/assignment-insights";
import type { Assignment } from "@/types/assignment";

interface AssignmentDetailSidebarProps {
  assignment: Assignment;
}

function MaterialFileIcon({ fileType }: { fileType: string }) {
  return (
    <div className="source-material-item__icon">
      <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{fileType}</span>
    </div>
  );
}

export function AssignmentDetailSidebar({
  assignment,
}: AssignmentDetailSidebarProps) {
  const metrics = assignment.generationMetrics;
  const materialPages = estimateMaterialPages(
    assignment.materialSource?.charCount,
  );
  const compression = computeCompressionSavings(
    assignment.materialSource?.charCount,
    assignment.materialSummary?.length,
  );
  const generationTime = formatDurationMs(metrics?.durationMs);
  const provider = metrics?.provider ?? metrics?.model;

  const insightItems = [
    materialPages != null
      ? { label: "Material Pages", value: String(materialPages), icon: FileText }
      : null,
    compression
      ? { label: "Compression Savings", value: compression, icon: Zap }
      : null,
    generationTime
      ? { label: "Generation Time", value: generationTime, icon: Timer }
      : null,
    provider
      ? { label: "AI Provider", value: provider, icon: Sparkles }
      : null,
  ].filter(Boolean) as {
    label: string;
    value: string;
    icon: typeof FileText;
  }[];

  const fileName =
    assignment.materialSource?.fileName ?? assignment.originalFileName;
  const fileType =
    assignment.materialSource?.fileType ??
    assignment.materialSourceType ??
    null;

  return (
    <aside className="assignment-detail-sidebar">
      {insightItems.length > 0 ? (
        <section className="stitch-card stitch-card--compact">
          <h2 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
            Generation Insights
          </h2>
          <dl className="generation-insights-list">
            {insightItems.map((item) => (
              <div key={item.label} className="generation-insights-list__item">
                <dt>
                  <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {item.label}
                </dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="stitch-card stitch-card--compact">
        <h2 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
          Source Materials
        </h2>
        {fileName ? (
          <ul className="source-material-list">
            <li className="source-material-item">
              <MaterialFileIcon fileType={fileType ?? "file"} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                  {fileName}
                </p>
                {fileType ? (
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                    {fileType}
                  </p>
                ) : null}
              </div>
            </li>
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
            No source file attached to this assignment.
          </p>
        )}
      </section>
    </aside>
  );
}
