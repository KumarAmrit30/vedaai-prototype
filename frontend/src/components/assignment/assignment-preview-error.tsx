"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export type PreviewErrorKind = "failed" | "timeout" | "invalid";

interface AssignmentPreviewErrorProps {
  kind: PreviewErrorKind;
  onRetry?: () => void;
  onBack?: () => void;
}

const messages: Record<
  PreviewErrorKind,
  { title: string; description: string }
> = {
  failed: {
    title: "Generation couldn't complete",
    description:
      "Unable to generate this assignment. Please retry or adjust your inputs and try again.",
  },
  timeout: {
    title: "Generation is taking longer than expected",
    description:
      "We’re still waiting on the AI response. Try again in a moment or regenerate with your current settings.",
  },
  invalid: {
    title: "Preview isn’t ready yet",
    description:
      "The assignment finished processing, but the paper content wasn’t returned in a usable format.",
  },
};

export function AssignmentPreviewError({
  kind,
  onRetry,
  onBack,
}: AssignmentPreviewErrorProps) {
  const copy = messages[kind];

  return (
    <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--border-light)] bg-[var(--surface-muted)]">
        <AlertTriangle
          className="h-5 w-5 text-[var(--orange-primary)]"
          strokeWidth={2}
        />
      </div>
      <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
        {copy.title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
        {copy.description}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        {onBack ? (
          <button type="button" onClick={onBack} className="outline-pill-btn">
            Back to details
          </button>
        ) : null}
        {onRetry ? (
          <button type="button" onClick={onRetry} className="submit-pill-btn">
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
