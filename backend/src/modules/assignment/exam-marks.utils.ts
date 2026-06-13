import type {
  BlueprintSectionDefinition,
  ExamBlueprint,
} from "./exam-blueprint.types";
import type { GeneratedPaper } from "./assignment.types";

/** Marks for a single blueprint section (authoritative when sections differ). */
export function computeSectionMarks(section: {
  numberOfQuestions: number;
  marksPerQuestion: number;
}): number {
  return section.numberOfQuestions * section.marksPerQuestion;
}

/** Sum section marks — the authoritative total for any blueprint. */
export function computeBlueprintTotalMarks(
  blueprint: Pick<ExamBlueprint, "sections">,
): number {
  return blueprint.sections.reduce(
    (sum, section) => sum + computeSectionMarks(section),
    0,
  );
}

/**
 * Default marks-per-question for legacy `questionConfig`. When every section
 * shares the same value, that value is returned. Otherwise the first section's
 * marks are used as a fallback label — callers must use `totalMarks` for totals.
 */
export function deriveDefaultMarksPerQuestion(
  blueprint: Pick<ExamBlueprint, "sections">,
): number {
  if (blueprint.sections.length === 0) {
    return 1;
  }

  const marksValues = blueprint.sections.map(
    (section) => section.marksPerQuestion,
  );
  const unique = new Set(marksValues);

  if (unique.size === 1) {
    return marksValues[0] ?? 1;
  }

  return blueprint.sections[0]?.marksPerQuestion ?? 1;
}

/** Sum marks from a generated paper (actual question-level marks). */
export function computeGeneratedPaperTotalMarks(
  paper: GeneratedPaper | undefined,
): number | undefined {
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

export function resolveAssignmentTotalMarks(input: {
  examBlueprint?: Pick<ExamBlueprint, "sections" | "totalMarks">;
  questionConfig?: {
    totalMarks?: number;
    numberOfQuestions?: number;
    marksPerQuestion?: number;
  };
  generatedPaper?: GeneratedPaper;
}): number {
  const fromPaper = computeGeneratedPaperTotalMarks(input.generatedPaper);
  if (fromPaper !== undefined) {
    return fromPaper;
  }

  if (input.examBlueprint?.totalMarks !== undefined) {
    return input.examBlueprint.totalMarks;
  }

  if (input.examBlueprint?.sections?.length) {
    return computeBlueprintTotalMarks(input.examBlueprint);
  }

  if (input.questionConfig?.totalMarks !== undefined) {
    return input.questionConfig.totalMarks;
  }

  const questions = input.questionConfig?.numberOfQuestions ?? 0;
  const marksPerQuestion = input.questionConfig?.marksPerQuestion ?? 1;
  return questions * marksPerQuestion;
}

export function assertBlueprintTotalsMatchSections(
  blueprint: ExamBlueprint,
): void {
  const computedQuestions = blueprint.sections.reduce(
    (sum, section) => sum + section.numberOfQuestions,
    0,
  );
  const computedMarks = computeBlueprintTotalMarks(blueprint);

  if (computedQuestions !== blueprint.totalQuestions) {
    throw new Error(
      `Blueprint totalQuestions (${blueprint.totalQuestions}) does not match section sum (${computedQuestions})`,
    );
  }

  if (computedMarks !== blueprint.totalMarks) {
    throw new Error(
      `Blueprint totalMarks (${blueprint.totalMarks}) does not match section sum (${computedMarks})`,
    );
  }
}

export function describeSectionMarks(
  sections: BlueprintSectionDefinition[],
): string {
  return sections
    .map(
      (section) =>
        `${section.title}: ${section.numberOfQuestions}×${section.marksPerQuestion}`,
    )
    .join(", ");
}
