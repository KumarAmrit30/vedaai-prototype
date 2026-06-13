import type { Assignment, Question } from "@/types/assignment";

const OPTION_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function formatOptionLabel(index: number): string {
  return OPTION_LABELS[index] ?? String(index + 1);
}

export function hasDisplayableOptions(
  question: Pick<Question, "options">,
): boolean {
  return Array.isArray(question.options) && question.options.length >= 2;
}

export function answerLineCountForQuestionType(questionType: string): number {
  if (questionType === "long-answer" || questionType === "long_answer") {
    return 3;
  }
  if (questionType === "short-answer" || questionType === "short_answer") {
    return 2;
  }
  return 1;
}

export function resolveSectionQuestionType(
  assignment: Assignment,
  sectionIndex: number,
): string {
  return (
    assignment.examBlueprint?.sections[sectionIndex]?.questionType ??
    assignment.questionConfig.questionType ??
    "mixed"
  );
}

export function assignmentHasGeneratedPaper(assignment: Assignment): boolean {
  return Boolean(
    assignment.generatedPaper?.sections?.some(
      (section) => section.questions.length > 0,
    ),
  );
}
