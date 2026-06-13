"use client";

import { Clock3 } from "lucide-react";

export function AssignmentSolutionsComingSoon() {
  return (
    <div className="product-state-card surface-card-compact px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[var(--border-light)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
        <Clock3 className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </div>
      <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
        Solutions Coming Soon
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[var(--text-secondary)]">
        Answer keys, explanations, and marking guides will be available in a
        future release. For now, use the Preview tab to review and export your
        generated paper.
      </p>
    </div>
  );
}
