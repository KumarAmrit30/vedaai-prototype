import type { CreateAssignmentForm } from "@/components/assignment/assignment-create-flow";
import type { Assignment } from "@/types/assignment";

export const DUPLICATE_ASSIGNMENT_KEY = "veda:duplicate-assignment";

export function assignmentToForm(assignment: Assignment): CreateAssignmentForm {
  return {
    title: `${assignment.title} (Copy)`,
    topic: assignment.topic,
    dueDate: assignment.dueDate.slice(0, 10),
    instructions: assignment.instructions,
    questionType: assignment.questionConfig.questionType,
    numberOfQuestions: String(assignment.questionConfig.numberOfQuestions),
    marksPerQuestion: String(assignment.questionConfig.marksPerQuestion),
  };
}

export function storeDuplicateAssignment(assignment: Assignment): void {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(
    DUPLICATE_ASSIGNMENT_KEY,
    JSON.stringify(assignmentToForm(assignment)),
  );
}

export function consumeDuplicateForm(): CreateAssignmentForm | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(DUPLICATE_ASSIGNMENT_KEY);
  if (!raw) return null;

  sessionStorage.removeItem(DUPLICATE_ASSIGNMENT_KEY);

  try {
    return JSON.parse(raw) as CreateAssignmentForm;
  } catch {
    return null;
  }
}
