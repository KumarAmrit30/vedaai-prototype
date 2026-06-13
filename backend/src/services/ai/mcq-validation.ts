/** Question types that require selectable options in generated output. */
export const MCQ_QUESTION_TYPES = new Set(["mcq", "multiple-choice"]);

export const TRUE_FALSE_QUESTION_TYPE = "true-false";

export const OBJECTIVE_QUESTION_TYPES = new Set<string>([
  ...MCQ_QUESTION_TYPES,
  TRUE_FALSE_QUESTION_TYPE,
]);

export function isObjectiveQuestionType(questionType: string): boolean {
  return OBJECTIVE_QUESTION_TYPES.has(questionType);
}

export function isMcqQuestionType(questionType: string): boolean {
  return MCQ_QUESTION_TYPES.has(questionType);
}

export function requiredOptionCount(questionType: string): number | null {
  if (isMcqQuestionType(questionType)) {
    return 4;
  }

  if (questionType === TRUE_FALSE_QUESTION_TYPE) {
    return 2;
  }

  return null;
}

function formatQuestionLabel(questionType: string, questionNumber: number): string {
  if (questionType === TRUE_FALSE_QUESTION_TYPE) {
    return `True/false question ${questionNumber}`;
  }

  return `MCQ question ${questionNumber}`;
}

export interface ObjectiveSectionValidationContext {
  questionType: string;
  questions: ReadonlyArray<{ options?: string[] | undefined }>;
  /** Paper-wide question number of the first question in this slice. */
  firstQuestionNumber: number;
}

function validateSingleObjectiveQuestion(
  questionType: string,
  questionNumber: number,
  question: { options?: string[] | undefined },
  answer: string | undefined,
  expectedOptionCount: number,
): void {
  const label = formatQuestionLabel(questionType, questionNumber);

  if (!question.options) {
    throw new Error(`${label} is missing options`);
  }

  if (question.options.length !== expectedOptionCount) {
    throw new Error(
      `${label} must contain exactly ${expectedOptionCount} options`,
    );
  }

  const trimmedOptions = question.options.map((option) => option.trim());

  if (trimmedOptions.some((option) => option.length === 0)) {
    throw new Error(`${label} contains empty options`);
  }

  const normalized = trimmedOptions.map((option) => option.toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${label} contains duplicate options`);
  }

  if (answer === undefined) {
    throw new Error(`${label} is missing an answerKey entry`);
  }

  const trimmedAnswer = answer.trim();
  if (!trimmedOptions.includes(trimmedAnswer)) {
    throw new Error(`${label} answer is not present in options`);
  }
}

export function validateObjectiveQuestionsInResponse(
  sections: ObjectiveSectionValidationContext[],
  answerKey: ReadonlyArray<{ questionNumber: number; answer: string }>,
): void {
  const answers = new Map(
    answerKey.map((entry) => [entry.questionNumber, entry.answer]),
  );

  for (const section of sections) {
    const expectedOptionCount = requiredOptionCount(section.questionType);
    if (expectedOptionCount === null) {
      continue;
    }

    for (let index = 0; index < section.questions.length; index += 1) {
      const questionNumber = section.firstQuestionNumber + index;
      const question = section.questions[index];
      if (!question) {
        continue;
      }

      validateSingleObjectiveQuestion(
        section.questionType,
        questionNumber,
        question,
        answers.get(questionNumber),
        expectedOptionCount,
      );
    }
  }
}

export function firstQuestionNumberForBlueprintSection(
  sections: ReadonlyArray<{ numberOfQuestions: number }>,
  sectionIndex: number,
): number {
  let offset = 0;

  for (let index = 0; index < sectionIndex; index += 1) {
    offset += sections[index]?.numberOfQuestions ?? 0;
  }

  return offset + 1;
}
