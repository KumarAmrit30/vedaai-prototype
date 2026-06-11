"use client";

import { AlertCircle, X } from "lucide-react";
import {
  formatDraftRelativeTime,
  type DraftUploadMetadata,
} from "@/lib/workspace/create-draft";

interface DraftRecoveryBannerProps {
  savedAt: string;
  uploadMetadata: DraftUploadMetadata;
  onDismiss: () => void;
}

export function DraftRecoveryBanner({
  savedAt,
  uploadMetadata,
  onDismiss,
}: DraftRecoveryBannerProps) {
  const fileCount = uploadMetadata.uploadedFileCount;
  const fileLabel = fileCount === 1 ? "file" : "files";

  return (
    <div className="draft-recovery-banner surface-card-compact" role="status">
      <div className="draft-recovery-banner__content">
        <div className="draft-recovery-banner__icon" aria-hidden="true">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--text-primary)]">
            Draft restored from {formatDraftRelativeTime(savedAt)}.
          </p>
          {fileCount > 0 ? (
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              Previous uploads cannot be restored automatically. Please re-upload
              your {fileCount} {fileLabel}.
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss draft recovery message"
        className="topbar-icon-btn h-8 w-8 shrink-0"
      >
        <X className="h-[15px] w-[15px]" strokeWidth={2} />
      </button>
    </div>
  );
}
