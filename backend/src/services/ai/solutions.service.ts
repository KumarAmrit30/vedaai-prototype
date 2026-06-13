import { env } from "../../config/env";
import type {
  AnswerKeyEntry,
  AnswerKeyMode,
  GeneratedPaper,
} from "../../modules/assignment/assignment.types";
import { logInfo } from "../../utils/logger";
import {
  AssignmentGenerationError,
  classifyGenerationError,
} from "./generation-metrics";
import { getAIProvider } from "./providers";
import { parseSolutionsResponse } from "./solutions-response.parser";
import { buildSolutionsSectionPrompt } from "./solutions-prompt.builder";
import { VERTEX_SOLUTIONS_RESPONSE_SCHEMA } from "./vertex-exam-schema";

export interface SolutionsGenerationInput {
  assignmentId: string;
  title: string;
  topic: string;
  instructions: string;
  answerKeyMode: AnswerKeyMode;
  generatedPaper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
}

export interface SolutionsGenerationResult {
  answerKey: AnswerKeyEntry[];
  retryCount: number;
  promptTokens?: number;
  completionTokens?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Generates explanations (and, for DETAILED mode, marking guides + rubrics)
 * for an already-generated paper. Runs section-by-section and merges the
 * results back into the answer key by question number (Phase 4).
 */
export async function generateAssignmentSolutions(
  input: SolutionsGenerationInput,
): Promise<SolutionsGenerationResult> {
  const provider = getAIProvider();
  const startedAt = Date.now();

  // Index existing answer-key entries by question number for in-place merge.
  const merged = new Map<number, AnswerKeyEntry>();
  for (const entry of input.answerKey) {
    merged.set(entry.questionNumber, { ...entry });
  }

  let retryCount = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let hasPromptTokens = false;
  let hasCompletionTokens = false;
  let globalOffset = 0;

  logInfo("[AI][SOLUTIONS] Started", {
    assignmentId: input.assignmentId,
    provider: provider.name,
    answerKeyMode: input.answerKeyMode,
    sections: input.generatedPaper.sections.length,
  });

  try {
    for (
      let sectionIndex = 0;
      sectionIndex < input.generatedPaper.sections.length;
      sectionIndex += 1
    ) {
      if (sectionIndex > 0 && env.vertexSectionDelayMs > 0) {
        await sleep(env.vertexSectionDelayMs);
      }

      const section = input.generatedPaper.sections[sectionIndex];
      if (!section || section.questions.length === 0) continue;

      const firstQuestionNumber = globalOffset + 1;
      const sectionAnswerKey = input.answerKey.slice(
        globalOffset,
        globalOffset + section.questions.length,
      );

      const prompt = buildSolutionsSectionPrompt({
        title: input.title,
        topic: input.topic,
        instructions: input.instructions,
        sectionTitle: section.title,
        ...(section.subject ? { subject: section.subject } : {}),
        answerKeyMode: input.answerKeyMode,
        questions: section.questions,
        answerKey: sectionAnswerKey,
        firstQuestionNumber,
      });

      const providerResult = await provider.generateAssignment(
        prompt,
        VERTEX_SOLUTIONS_RESPONSE_SCHEMA,
      );
      retryCount += providerResult.retryCount;

      if (providerResult.promptTokens !== undefined) {
        promptTokens += providerResult.promptTokens;
        hasPromptTokens = true;
      }
      if (providerResult.completionTokens !== undefined) {
        completionTokens += providerResult.completionTokens;
        hasCompletionTokens = true;
      }

      const parsed = parseSolutionsResponse(providerResult.text);
      for (const solution of parsed.solutions) {
        const entry = merged.get(solution.questionNumber);
        if (!entry) continue;

        entry.explanation = solution.explanation;
        if (input.answerKeyMode === "DETAILED") {
          if (solution.markingGuide) entry.markingGuide = solution.markingGuide;
          if (solution.rubric) entry.rubric = solution.rubric;
        }
      }

      globalOffset += section.questions.length;
    }

    const answerKey = [...merged.values()].sort(
      (a, b) => a.questionNumber - b.questionNumber,
    );

    logInfo("[AI][SOLUTIONS] Completed", {
      assignmentId: input.assignmentId,
      provider: provider.name,
      durationMs: Date.now() - startedAt,
      retryCount,
      promptTokens: hasPromptTokens ? promptTokens : undefined,
      completionTokens: hasCompletionTokens ? completionTokens : undefined,
    });

    return {
      answerKey,
      retryCount,
      ...(hasPromptTokens ? { promptTokens } : {}),
      ...(hasCompletionTokens ? { completionTokens } : {}),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown solutions error";
    throw new AssignmentGenerationError(message, {
      provider: provider.name,
      model: provider.model,
      durationMs: Date.now() - startedAt,
      retryCount,
      errorCategory: classifyGenerationError(error),
    });
  }
}
