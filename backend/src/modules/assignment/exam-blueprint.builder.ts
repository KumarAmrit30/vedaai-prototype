import {
  getExamTemplate,
  resolveDifficultyDistribution,
  type ExamTemplate,
} from "./exam-template";
import type {
  BlueprintSectionDefinition,
  BuildExamBlueprintInput,
  ExamBlueprint,
} from "./exam-blueprint.types";

function defaultInstructionFor(questionType: string): string {
  switch (questionType) {
    case "multiple-choice":
    case "mcq":
      return "Select the single best option for each question.";
    case "true-false":
      return "Mark each statement as true or false.";
    case "short-answer":
    case "short_answer":
      return "Answer briefly with the key points.";
    case "long-answer":
    case "long_answer":
      return "Answer with detailed explanations.";
    default:
      return "Answer all questions in this section.";
  }
}

function sectionsFromTemplate(
  template: ExamTemplate,
): BlueprintSectionDefinition[] {
  return template.subjectDistribution.map((entry, index) => {
    const questionType = entry.questionType ?? template.defaultQuestionType;
    const marksPerQuestion =
      entry.marksPerQuestion ?? template.marksPerQuestion;

    return {
      sectionId: `section-${index + 1}`,
      title: entry.subject,
      instruction: entry.instruction ?? defaultInstructionFor(questionType),
      questionType,
      numberOfQuestions: entry.questionCount,
      marksPerQuestion,
      subject: entry.subject,
    };
  });
}

function computeTotals(sections: BlueprintSectionDefinition[]): {
  totalQuestions: number;
  totalMarks: number;
} {
  return sections.reduce(
    (acc, section) => ({
      totalQuestions: acc.totalQuestions + section.numberOfQuestions,
      totalMarks:
        acc.totalMarks + section.numberOfQuestions * section.marksPerQuestion,
    }),
    { totalQuestions: 0, totalMarks: 0 },
  );
}

export function buildExamBlueprint(input: BuildExamBlueprintInput): ExamBlueprint {
  const template = getExamTemplate(
    input.examPattern,
    input.examPattern === "CUSTOM"
      ? {
          questionType: input.questionType!,
          numberOfQuestions: input.numberOfQuestions!,
          marksPerQuestion: input.marksPerQuestion!,
          difficultyLevel: input.difficultyLevel,
        }
      : undefined,
  );

  const sections = sectionsFromTemplate(template);
  const { totalQuestions, totalMarks } = computeTotals(sections);

  return {
    examPattern: input.examPattern,
    difficultyLevel: input.difficultyLevel,
    sections,
    totalQuestions,
    totalMarks,
    answerKeyMode: template.answerKeyMode,
    difficultyDistribution: resolveDifficultyDistribution(
      template,
      input.difficultyLevel,
    ),
    questionStyle: template.questionStyle,
    reasoningLevel: template.reasoningLevel,
  };
}

export function deriveLegacyQuestionConfig(
  blueprint: ExamBlueprint,
  fallback?: {
    questionType?: string;
    numberOfQuestions?: number;
    marksPerQuestion?: number;
  },
): {
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
} {
  if (blueprint.examPattern === "CUSTOM" && fallback) {
    return {
      questionType: fallback.questionType!,
      numberOfQuestions: fallback.numberOfQuestions!,
      marksPerQuestion: fallback.marksPerQuestion!,
    };
  }

  const primarySection = blueprint.sections[0];

  return {
    questionType: primarySection?.questionType ?? fallback?.questionType ?? "mixed",
    numberOfQuestions: blueprint.totalQuestions,
    marksPerQuestion:
      primarySection?.marksPerQuestion ?? fallback?.marksPerQuestion ?? 1,
  };
}
