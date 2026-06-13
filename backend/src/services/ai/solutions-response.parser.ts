import { jsonrepair } from "jsonrepair";
import { z } from "zod";
import { logError, logInfo } from "../../utils/logger";

export const solutionEntrySchema = z.object({
  questionNumber: z
    .number()
    .int()
    .positive("questionNumber must be a positive integer"),
  explanation: z.string().min(1, "explanation is required"),
  markingGuide: z.string().min(1).optional(),
  rubric: z.string().min(1).optional(),
});

export const solutionsResponseSchema = z.object({
  solutions: z
    .array(solutionEntrySchema)
    .min(1, "solutions must contain at least one entry"),
});

export type SolutionEntry = z.infer<typeof solutionEntrySchema>;
export type SolutionsResponse = z.infer<typeof solutionsResponseSchema>;

function cleanRawText(rawText: string): string {
  let cleaned = rawText.trim();

  if (!cleaned) {
    throw new Error("AI response is empty");
  }

  const fencedBlockMatch = cleaned.match(
    /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i,
  );

  if (fencedBlockMatch?.[1]) {
    cleaned = fencedBlockMatch[1].trim();
  } else {
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
  } catch (parseError) {
    const parseMessage =
      parseError instanceof Error ? parseError.message : "Unknown JSON parse error";

    try {
      const repaired = jsonrepair(cleanedText);
      const parsed = JSON.parse(repaired) as unknown;
      logInfo("[AI][SOLUTIONS_PARSER] JSON repaired successfully", {
        responseLength: cleanedText.length,
      });
      return parsed;
    } catch {
      logError("[AI][SOLUTIONS_PARSER] JSON parse and repair failed", {
        parseMessage,
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

export function parseSolutionsResponse(rawText: string): SolutionsResponse {
  const parsed = parseJson(cleanRawText(rawText));
  const result = solutionsResponseSchema.safeParse(parsed);

  if (!result.success) {
    logError("[AI][SOLUTIONS_PARSER] Schema validation failed", {
      issues: formatZodError(result.error),
    });
    throw new Error(
      `AI solutions validation failed: ${formatZodError(result.error)}`,
    );
  }

  return result.data;
}
