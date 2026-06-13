import { jsonrepair } from "jsonrepair";
import { z } from "zod";
import { logError, logInfo } from "../../utils/logger";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const questionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  difficulty: difficultySchema,
  marks: z.number().int().positive("Marks must be a positive integer"),
  // Present for objective question types; optional for written-answer types.
  options: z.array(z.string().min(1)).min(2).optional(),
});

export const sectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  instruction: z.string().min(1, "Section instruction is required"),
  questions: z
    .array(questionSchema)
    .min(1, "Each section must contain at least one question"),
});

/**
 * Deferred-solution answer key (Phase 4): paper generation emits only the
 * question number and the correct answer. Explanations, marking guides, and
 * rubrics are added later on demand and are therefore optional here.
 */
export const answerKeyEntrySchema = z.object({
  questionNumber: z
    .number()
    .int()
    .positive("questionNumber must be a positive integer"),
  answer: z.string().min(1, "answer is required"),
  explanation: z.string().min(1).optional(),
  markingGuide: z.string().min(1).optional(),
  rubric: z.string().min(1).optional(),
});

export type AnswerKeyEntry = z.infer<typeof answerKeyEntrySchema>;

export interface ParseAIResponseOptions {
  /**
   * First expected answerKey questionNumber. Defaults to 1 (local / legacy).
   * Batched generation passes the batch's global start (e.g. 16 for batch 2).
   */
  answerKeyStartNumber?: number;
}

function buildExpectedAnswerKeyNumbers(
  questionCount: number,
  startNumber: number,
): number[] {
  return Array.from(
    { length: questionCount },
    (_, index) => startNumber + index,
  );
}

function validateAnswerKeySequence(
  answerKey: Array<{ questionNumber: number }>,
  questionCount: number,
  startNumber: number,
  ctx: z.RefinementCtx,
): void {
  if (answerKey.length !== questionCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `answerKey must contain exactly ${questionCount} entries (one per question)`,
      path: ["answerKey"],
    });
    return;
  }

  const numbers = answerKey.map((entry) => entry.questionNumber);
  const uniqueNumbers = new Set(numbers);

  if (uniqueNumbers.size !== numbers.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "answerKey questionNumber values must be unique",
      path: ["answerKey"],
    });
    return;
  }

  const expected = buildExpectedAnswerKeyNumbers(questionCount, startNumber);
  const sorted = [...numbers].sort((a, b) => a - b);
  const endNumber = startNumber + questionCount - 1;

  for (let index = 0; index < expected.length; index += 1) {
    if (sorted[index] !== expected[index]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          startNumber === 1
            ? "answerKey questionNumber values must be sequential from 1 to the total question count (section order)"
            : `answerKey questionNumber values must be sequential from ${startNumber} to ${endNumber}`,
        path: ["answerKey"],
      });
      return;
    }
  }
}

function buildAssignmentResponseSchema(answerKeyStartNumber: number) {
  return z
    .object({
      sections: z
        .array(sectionSchema)
        .min(1, "Assignment must contain at least one section"),
      answerKey: z
        .array(answerKeyEntrySchema)
        .min(1, "answerKey must contain at least one entry"),
    })
    .superRefine((data, ctx) => {
      const totalQuestions = data.sections.reduce(
        (sum, section) => sum + section.questions.length,
        0,
      );

      validateAnswerKeySequence(
        data.answerKey,
        totalQuestions,
        answerKeyStartNumber,
        ctx,
      );
    });
}

/** Default schema: answerKey numbered 1..N (legacy and non-batched paths). */
const assignmentResponseSchema = buildAssignmentResponseSchema(1);

export type Difficulty = z.infer<typeof difficultySchema>;
export type Question = z.infer<typeof questionSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type AssignmentResponse = z.infer<typeof assignmentResponseSchema>;

function cleanRawText(rawText: string): string {
  let cleaned = rawText.trim();

  if (!cleaned) {
    throw new Error("AI response is empty");
  }

  // Strip full fenced blocks: ```json ... ``` or ``` ... ```
  const fencedBlockMatch = cleaned.match(
    /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i,
  );

  if (fencedBlockMatch?.[1]) {
    cleaned = fencedBlockMatch[1].trim();
  } else {
    // Strip partial fences if Gemini wraps only the start or end
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();
  }

  if (!cleaned) {
    throw new Error("AI response is empty after cleaning");
  }

  return cleaned;
}

function countQuestionsFromParsed(parsed: unknown): number | undefined {
  if (!parsed || typeof parsed !== "object" || !("sections" in parsed)) {
    return undefined;
  }

  const sections = (parsed as { sections?: unknown }).sections;

  if (!Array.isArray(sections)) {
    return undefined;
  }

  return sections.reduce((total, section) => {
    if (!section || typeof section !== "object" || !("questions" in section)) {
      return total;
    }

    const questions = (section as { questions?: unknown }).questions;
    return total + (Array.isArray(questions) ? questions.length : 0);
  }, 0);
}

function parseJson(cleanedText: string): unknown {
  try {
    return JSON.parse(cleanedText) as unknown;
  } catch (parseError) {
    const parseMessage =
      parseError instanceof Error
        ? parseError.message
        : "Unknown JSON parse error";

    try {
      const repaired = jsonrepair(cleanedText);
      const parsed = JSON.parse(repaired) as unknown;
      logInfo("[AI][PARSER] JSON repaired successfully", {
        responseLength: cleanedText.length,
      });
      return parsed;
    } catch (repairError) {
      const repairMessage =
        repairError instanceof Error
          ? repairError.message
          : "Unknown JSON repair error";
      logError("[AI][PARSER] JSON parse and repair failed", {
        parseMessage,
        repairMessage,
        responseLength: cleanedText.length,
      });
      throw new Error(`Failed to parse AI response as JSON: ${parseMessage}`);
    }
  }
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

export function parseAIResponse(
  rawText: string,
  options?: ParseAIResponseOptions,
): AssignmentResponse {
  const cleanedText = cleanRawText(rawText);
  const parsed = parseJson(cleanedText);

  const answerKeyStartNumber = options?.answerKeyStartNumber ?? 1;
  const schema =
    answerKeyStartNumber === 1
      ? assignmentResponseSchema
      : buildAssignmentResponseSchema(answerKeyStartNumber);

  const result = schema.safeParse(parsed);

  if (!result.success) {
    const questionCount = countQuestionsFromParsed(parsed);
    logError("[AI][PARSER] Schema validation failed", {
      issues: formatZodError(result.error),
      ...(questionCount !== undefined ? { questionCount } : {}),
    });
    throw new Error(
      `AI response validation failed: ${formatZodError(result.error)}`,
    );
  }

  return result.data;
}
