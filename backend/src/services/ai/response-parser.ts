import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const questionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  difficulty: difficultySchema,
  marks: z.number().int().positive("Marks must be a positive integer"),
});

export const sectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  instruction: z.string().min(1, "Section instruction is required"),
  questions: z
    .array(questionSchema)
    .min(1, "Each section must contain at least one question"),
});

export const answerKeyEntrySchema = z.object({
  questionNumber: z
    .number()
    .int()
    .positive("questionNumber must be a positive integer"),
  answer: z.string().min(1, "answer is required"),
  explanation: z.string().min(1, "explanation is required"),
  markingGuide: z.string().min(1, "markingGuide is required"),
});

export const assignmentResponseSchema = z
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

    if (data.answerKey.length !== totalQuestions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `answerKey must contain exactly ${totalQuestions} entries (one per question)`,
        path: ["answerKey"],
      });
      return;
    }

    const numbers = data.answerKey.map((entry) => entry.questionNumber);
    const uniqueNumbers = new Set(numbers);

    if (uniqueNumbers.size !== numbers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "answerKey questionNumber values must be unique",
        path: ["answerKey"],
      });
      return;
    }

    const expected = Array.from({ length: totalQuestions }, (_, index) => index + 1);
    const sorted = [...numbers].sort((a, b) => a - b);

    for (let index = 0; index < expected.length; index += 1) {
      if (sorted[index] !== expected[index]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "answerKey questionNumber values must be sequential from 1 to the total question count (section order)",
          path: ["answerKey"],
        });
        return;
      }
    }
  });

export type Difficulty = z.infer<typeof difficultySchema>;
export type Question = z.infer<typeof questionSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type AnswerKeyEntry = z.infer<typeof answerKeyEntrySchema>;
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

function parseJson(cleanedText: string): unknown {
  try {
    return JSON.parse(cleanedText) as unknown;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown JSON parse error";
    throw new Error(`Failed to parse AI response as JSON: ${message}`);
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

export function parseAIResponse(rawText: string): AssignmentResponse {
  const cleanedText = cleanRawText(rawText);
  const parsed = parseJson(cleanedText);

  const result = assignmentResponseSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `AI response validation failed: ${formatZodError(result.error)}`,
    );
  }

  return result.data;
}
