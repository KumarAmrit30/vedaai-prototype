"use client";

import type { UserPlan } from "@/store/user.store";

interface PlanBadgeProps {
  plan?: UserPlan;
  className?: string;
}

const PLAN_LABELS: Record<UserPlan, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  enterprise: "Enterprise Plan",
};

const PLAN_STYLES: Record<UserPlan, string> = {
  free: "border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)]",
  pro: "border-[var(--orange-primary)] bg-[var(--orange-primary)]/10 text-[var(--orange-primary)]",
  enterprise: "border-[var(--black-primary)] bg-[var(--black-primary)] text-white",
};

/**
 * Plan indicator. Only `free` is active in the current phase; `pro` and
 * `enterprise` styles are prepared for future upgrade tiers.
 */
export function PlanBadge({ plan = "free", className = "" }: PlanBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${PLAN_STYLES[plan]} ${className}`}
    >
      {PLAN_LABELS[plan]}
    </span>
  );
}
