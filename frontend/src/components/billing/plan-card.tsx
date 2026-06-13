"use client";

import { Check, Clock3 } from "lucide-react";
import type { Plan } from "@/types/billing";
import { formatPlanAssignmentLimit } from "@/lib/utils/usage-label";

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  highlight?: boolean;
}

const FEATURE_LABELS: Record<keyof Plan["features"], string> = {
  assignmentGeneration: "AI assignment generation",
  pdfExport: "PDF export",
  library: "Resource library",
  groups: "Department groups",
  bulkActions: "Bulk workspace actions",
  prioritySupport: "Priority support",
};

/** Shipped in catalog but not yet available in the product. */
const PREVIEW_ONLY_FEATURES = new Set<keyof Plan["features"]>([
  "library",
  "groups",
]);

function formatPrice(monthlyPrice: number | null): string {
  if (monthlyPrice === null) {
    return "Custom pricing";
  }

  if (monthlyPrice === 0) {
    return "Free";
  }

  return `$${monthlyPrice}/mo`;
}

export function PlanCard({
  plan,
  isCurrentPlan = false,
  highlight = false,
}: PlanCardProps) {
  const enabledFeatures = (
    Object.entries(plan.features) as [keyof Plan["features"], boolean][]
  ).filter(([, enabled]) => enabled);

  return (
    <article
      className={`surface-card-compact flex h-full flex-col p-6 ${
        highlight
          ? "ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--surface-base)]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {plan.displayName}
          </h2>
          <p className="mt-1 text-[24px] font-bold text-[var(--text-primary)]">
            {formatPrice(plan.monthlyPrice)}
          </p>
        </div>
        {isCurrentPlan ? (
          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
            Current
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
        {formatPlanAssignmentLimit(plan.assignmentLimit)}
      </p>

      <ul className="mt-5 flex flex-1 flex-col gap-2">
        {enabledFeatures.map(([key]) => {
          const isPreviewOnly = PREVIEW_ONLY_FEATURES.has(key);
          const label = isPreviewOnly
            ? `${FEATURE_LABELS[key]} (Coming Soon)`
            : FEATURE_LABELS[key];

          return (
            <li
              key={key}
              className={`flex items-start gap-2 text-[13px] ${
                isPreviewOnly
                  ? "text-[var(--text-muted)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {isPreviewOnly ? (
                <Clock3
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : (
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--orange-primary)]"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              )}
              <span>{label}</span>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled
        className="outline-pill-btn mt-6 w-full cursor-not-allowed opacity-80"
        aria-disabled="true"
      >
        Coming Soon
      </button>
    </article>
  );
}
