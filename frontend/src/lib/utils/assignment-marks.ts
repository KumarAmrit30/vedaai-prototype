import type { Assignment, GeneratedPaper } from "@/types/assignment";

function sumGeneratedPaperMarks(paper: GeneratedPaper | undefined): number | undefined {
  if (!paper?.sections?.length) {
    return undefined;
  }

  let total = 0;
  let hasMarks = false;

  for (const section of paper.sections) {
    for (const question of section.questions) {
      if (typeof question.marks === "number" && question.marks > 0) {
        total += question.marks;
        hasMarks = true;
      }
    }
  }

  return hasMarks ? total : undefined;
}

/**
 * Resolves the authoritative total marks for an assignment. Prefers actual
 * generated question marks, then blueprint totals, then persisted questionConfig
 * totalMarks, with a legacy fallback for older records.
 */
export function getAssignmentTotalMarks(assignment: Assignment): number {
  const fromPaper = sumGeneratedPaperMarks(assignment.generatedPaper);
  if (fromPaper !== undefined) {
    return fromPaper;
  }

  if (assignment.examBlueprint?.totalMarks !== undefined) {
    return assignment.examBlueprint.totalMarks;
  }

  if (assignment.questionConfig.totalMarks !== undefined) {
    return assignment.questionConfig.totalMarks;
  }

  return (
    assignment.questionConfig.numberOfQuestions *
    assignment.questionConfig.marksPerQuestion
  );
}

/** Whether section-level marks vary across the blueprint. */
export function hasVariableSectionMarks(assignment: Assignment): boolean {
  const sections = assignment.examBlueprint?.sections;
  if (!sections || sections.length <= 1) {
    return false;
  }

  const first = sections[0]?.marksPerQuestion;
  return sections.some((section) => section.marksPerQuestion !== first);
}

/** Human-readable marks label for metadata panels. */
export function formatMarksPerQuestionLabel(assignment: Assignment): string {
  if (hasVariableSectionMarks(assignment)) {
    return "Varies by section";
  }

  return String(assignment.questionConfig.marksPerQuestion);
}
