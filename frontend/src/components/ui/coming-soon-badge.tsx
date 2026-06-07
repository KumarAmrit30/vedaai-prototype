"use client";

import { Clock3 } from "lucide-react";

interface ComingSoonBadgeProps {
  compact?: boolean;
}

export function ComingSoonBadge({ compact = false }: ComingSoonBadgeProps) {
  return (
    <span
      className={`coming-soon-badge inline-flex shrink-0 items-center rounded-full border border-[var(--border-light)] bg-[var(--surface-muted)] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)] ${
        compact
          ? "gap-0 px-1 py-px text-[7px] leading-none"
          : "gap-1 px-1.5 py-0.5 text-[9px]"
      }`}
      aria-hidden="true"
    >
      {!compact ? <Clock3 className="h-2.5 w-2.5" strokeWidth={2} /> : null}
      Soon
    </span>
  );
}
