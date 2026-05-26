"use client";

import { Loader2 } from "lucide-react";

interface AssignmentLoadingProps {
  title?: string;
  message?: string;
}

export function AssignmentLoading({
  title = "Generating Assignment...",
  message = "AI is building your assessment paper. This usually takes a moment.",
}: AssignmentLoadingProps) {
  return (
    <div className="assignment-loading-panel surface-card-compact mx-auto max-w-xl px-5 py-8 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[14px] border border-[var(--border-light)] bg-[var(--surface-muted)]">
        <Loader2
          className="h-4 w-4 animate-spin text-[var(--orange-primary)] motion-reduce:animate-none"
          strokeWidth={2}
        />
      </div>
      <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {message}
      </p>

      <div className="mt-6 space-y-2.5 text-left">
        <div className="shimmer-block h-4 w-[38%]" />
        <div className="shimmer-block h-3.5 w-full" />
        <div className="shimmer-block h-3.5 w-[92%]" />
        <div className="mt-4 shimmer-block h-3.5 w-[28%]" />
        <div className="shimmer-block h-14 w-full" />
        <div className="shimmer-block h-14 w-full" />
        <div className="shimmer-block h-14 w-[85%]" />
      </div>
    </div>
  );
}
