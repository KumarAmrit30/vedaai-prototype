import { z } from "zod";
import {
  buildExamBlueprint,
  deriveLegacyQuestionConfig,
} from "./exam-blueprint.builder";
import {
  DIFFICULTY_LEVELS,
  EXAM_PATTERNS,
  type BuildExamBlueprintInput,
  type ExamPattern,
} from "./exam-blueprint.types";
import { QUESTION_TYPES } from "./assignment.constants";

const examPatternSchema = z.enum(EXAM_PATTERNS, {
  message: "examPattern must be a supported exam pattern",
});

const difficultyLevelSchema = z.enum(DIFFICULTY_LEVELS, {
  message: "difficultyLevel must be a supported difficulty level",
});

const legacyQuestionConfigFields = {
  questionType: z.enum(QUESTION_TYPES, {
    message: "questionType must be a supported question type",
  }),
  numberOfQuestions: z.coerce
    .number()
    .int("numberOfQuestions must be an integer")
    .min(1)
    .max(100),
  marksPerQuestion: z.coerce
    .number()
    .int("marksPerQuestion must be an integer")
    .min(1)
    .max(100),
};

const optionalLegacyQuestionConfigFields = {
  questionType: legacyQuestionConfigFields.questionType.optional(),
  numberOfQuestions: legacyQuestionConfigFields.numberOfQuestions.optional(),
  marksPerQuestion: legacyQuestionConfigFields.marksPerQuestion.optional(),
};

const baseQuestionConfigSchema = z.object({
  examPattern: examPatternSchema.default("CUSTOM"),
  difficultyLevel: difficultyLevelSchema.default("MIXED"),
  ...optionalLegacyQuestionConfigFields,
});

export const questionConfigSchema = baseQuestionConfigSchema.superRefine(
  (value, ctx) => {
    if (value.examPattern !== "CUSTOM") {
      return;
    }

    const customResult = z.object(legacyQuestionConfigFields).safeParse(value);

    if (!customResult.success) {
      for (const issue of customResult.error.issues) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: issue.path,
        });
      }
    }
  },
);

export type ValidatedQuestionConfig = z.infer<typeof questionConfigSchema>;

export interface ResolvedAssignmentConfig {
  questionConfig: {
    questionType: string;
    numberOfQuestions: number;
    marksPerQuestion: number;
    totalMarks: number;
    examPattern: ExamPattern;
    difficultyLevel: (typeof DIFFICULTY_LEVELS)[number];
  };
  examBlueprint: ReturnType<typeof buildExamBlueprint>;
}

function toBlueprintInput(
  input: ValidatedQuestionConfig,
): BuildExamBlueprintInput {
  const blueprintInput: BuildExamBlueprintInput = {
    examPattern: input.examPattern,
    difficultyLevel: input.difficultyLevel,
  };

  if (input.questionType !== undefined) {
    blueprintInput.questionType = input.questionType;
  }
  if (input.numberOfQuestions !== undefined) {
    blueprintInput.numberOfQuestions = input.numberOfQuestions;
  }
  if (input.marksPerQuestion !== undefined) {
    blueprintInput.marksPerQuestion = input.marksPerQuestion;
  }

  return blueprintInput;
}

export function resolveAssignmentConfig(
  input: ValidatedQuestionConfig,
): ResolvedAssignmentConfig {
  const examBlueprint = buildExamBlueprint(toBlueprintInput(input));

  const legacyFallback: {
    questionType?: string;
    numberOfQuestions?: number;
    marksPerQuestion?: number;
  } = {};

  if (input.questionType !== undefined) {
    legacyFallback.questionType = input.questionType;
  }
  if (input.numberOfQuestions !== undefined) {
    legacyFallback.numberOfQuestions = input.numberOfQuestions;
  }
  if (input.marksPerQuestion !== undefined) {
    legacyFallback.marksPerQuestion = input.marksPerQuestion;
  }

  const legacy = deriveLegacyQuestionConfig(examBlueprint, legacyFallback);

  return {
    questionConfig: {
      ...legacy,
      examPattern: input.examPattern,
      difficultyLevel: input.difficultyLevel,
    },
    examBlueprint,
  };
}
