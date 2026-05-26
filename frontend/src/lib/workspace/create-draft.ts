import type { CreateAssignmentForm } from "@/components/assignment/assignment-create-flow";
import type { FlowStepId } from "@/components/assignment/assignment-stepper";
import type { UploadedMaterial } from "@/components/assignment/assignment-upload";

const DRAFT_KEY = "veda:create-assignment-draft";

export interface CreateAssignmentDraft {
  form: CreateAssignmentForm;
  uploadedFiles: UploadedMaterial[];
  currentStep: FlowStepId;
  savedAt: string;
}

export function loadCreateDraft(): CreateAssignmentDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreateAssignmentDraft;
  } catch {
    return null;
  }
}

export function saveCreateDraft(draft: Omit<CreateAssignmentDraft, "savedAt">): void {
  if (typeof window === "undefined") return;

  const payload: CreateAssignmentDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function clearCreateDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

export function hasMeaningfulDraft(draft: CreateAssignmentDraft | null): boolean {
  if (!draft) return false;

  const { form } = draft;
  return Boolean(
    form.title.trim() ||
      form.topic.trim() ||
      form.instructions.trim() ||
      form.dueDate ||
      form.questionType ||
      form.numberOfQuestions ||
      form.marksPerQuestion ||
      draft.uploadedFiles.length > 0,
  );
}
