"use client";

import type { CreateAssignmentDraft } from "@/lib/workspace/create-draft";
import {
  formatDraftRelativeTime,
  hasRestoredUploadMetadata,
} from "@/lib/workspace/create-draft";

interface DraftResumePromptProps {
  draft: CreateAssignmentDraft;
  onResume: () => void;
  onDiscard: () => void;
}

export function DraftResumePrompt({
  draft,
  onResume,
  onDiscard,
}: DraftResumePromptProps) {
  return (
    <div className="draft-resume-prompt surface-card-compact">
      <div>
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
          Resume draft?
        </h3>
        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
          {draft.form.title.trim() || "Untitled assignment"} · saved{" "}
          {formatDraftRelativeTime(draft.savedAt)}
        </p>
        {hasRestoredUploadMetadata(draft.uploadMetadata) ? (
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">
            Includes {draft.uploadMetadata.uploadedFileCount} uploaded file
            {draft.uploadMetadata.uploadedFileCount === 1 ? "" : "s"} that must
            be re-added after restore.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onDiscard} className="outline-pill-btn">
          Start fresh
        </button>
        <button type="button" onClick={onResume} className="submit-pill-btn">
          Resume draft
        </button>
      </div>
    </div>
  );
}
