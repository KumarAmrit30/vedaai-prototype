"use client";

import type { CreateAssignmentDraft } from "@/lib/workspace/create-draft";
import { formatAssignmentDate } from "@/lib/utils/format-assignment";

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
          {formatAssignmentDate(draft.savedAt, "long")}
        </p>
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
