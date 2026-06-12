import type {
  AnswerKeyEntry,
  ExamBlueprint,
  GeneratedPaper,
  GenerationMetrics,
} from "../modules/assignment/assignment.types";
import { getAIProvider } from "./ai/providers";
import {
  AssignmentGenerationError,
  classifyGenerationError,
} from "./ai/generation-metrics";
import { buildAssignmentPrompt } from "./ai/assignment-prompt.builder";
import type {
  AssignmentGenerationInput,
  AssignmentGenerationResult,
} from "./ai/assignment-generation.types";
import {
  normalizeSectionFromBlueprint,
  validateMergedPaperAgainstBlueprint,
  validateSectionResponseAgainstBlueprint,
} from "./ai/blueprint-response.validator";
import { parseAIResponse } from "./ai/response-parser";
import { logDebug, logError, logInfo } from "../utils/logger";

export type { AssignmentGenerationInput, AssignmentGenerationResult } from "./ai/assignment-generation.types";

function buildFailureMetrics(
  providerName: string,
  model: string,
  durationMs: number,
  retryCount: number,
  error: unknown,
): GenerationMetrics {
  return {
    provider: providerName,
    model,
    durationMs,
    retryCount,
    errorCategory: classifyGenerationError(error),
  };
}

function offsetAnswerKeyEntries(
  entries: AnswerKeyEntry[],
  offset: number,
): AnswerKeyEntry[] {
  return entries.map((entry) => ({
    ...entry,
    questionNumber: entry.questionNumber + offset,
  }));
}

async function generateLegacyAssignmentPaper(
  input: AssignmentGenerationInput,
  provider: ReturnType<typeof getAIProvider>,
): Promise<{
  generatedPaper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
  retryCount: number;
}> {
  const prompt = buildAssignmentPrompt(input);
  const providerResult = await provider.generateAssignment(prompt);
  const structured = parseAIResponse(providerResult.text);

  const questionCount = structured.sections.reduce(
    (total, section) => total + section.questions.length,
    0,
  );

  const requestedCount = input.questionConfig.numberOfQuestions;
  if (questionCount !== requestedCount) {
    throw new Error(
      `AI response validation failed: generated ${questionCount} questions but ${requestedCount} were requested`,
    );
  }

  logDebug(`[AI][${provider.name}] Structured response validated`, {
    sections: structured.sections.length,
    questions: questionCount,
    answerKeyEntries: structured.answerKey.length,
  });

  return {
    generatedPaper: { sections: structured.sections },
    answerKey: structured.answerKey,
    retryCount: providerResult.retryCount,
  };
}

async function generateBlueprintAssignmentPaper(
  input: AssignmentGenerationInput,
  blueprint: ExamBlueprint,
  provider: ReturnType<typeof getAIProvider>,
): Promise<{
  generatedPaper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
  retryCount: number;
}> {
  const mergedSections: GeneratedPaper["sections"] = [];
  const mergedAnswerKey: AnswerKeyEntry[] = [];
  let retryCount = 0;
  let globalQuestionOffset = 0;

  for (let sectionIndex = 0; sectionIndex < blueprint.sections.length; sectionIndex += 1) {
    const section = blueprint.sections[sectionIndex];
    if (!section) continue;

    const prompt = buildAssignmentPrompt(input, {
      section,
      sectionIndex,
      totalSections: blueprint.sections.length,
      globalQuestionOffset,
    });

    const providerResult = await provider.generateAssignment(prompt);
    retryCount += providerResult.retryCount;

    const structured = parseAIResponse(providerResult.text);
    validateSectionResponseAgainstBlueprint(structured, blueprint, sectionIndex);

    const parsedSection = structured.sections[0];
    if (!parsedSection) {
      throw new Error(
        `AI response validation failed: Section ${sectionIndex + 1} is missing from provider response`,
      );
    }

    mergedSections.push(
      normalizeSectionFromBlueprint(parsedSection, section),
    );
    mergedAnswerKey.push(
      ...offsetAnswerKeyEntries(structured.answerKey, globalQuestionOffset),
    );
    globalQuestionOffset += section.numberOfQuestions;

    logDebug(`[AI][${provider.name}] Blueprint section validated`, {
      sectionIndex: sectionIndex + 1,
      sectionTitle: section.title,
      questions: section.numberOfQuestions,
    });
  }

  validateMergedPaperAgainstBlueprint(mergedSections, blueprint);

  logDebug(`[AI][${provider.name}] Blueprint paper validated`, {
    sections: mergedSections.length,
    questions: blueprint.totalQuestions,
    answerKeyEntries: mergedAnswerKey.length,
  });

  return {
    generatedPaper: { sections: mergedSections },
    answerKey: mergedAnswerKey,
    retryCount,
  };
}

export async function generateAssignmentPaper(
  input: AssignmentGenerationInput,
): Promise<AssignmentGenerationResult> {
  const startedAt = Date.now();
  const provider = getAIProvider();
  const { assignmentId } = input;
  let retryCount = 0;

  logInfo("[AI][GENERATION] Started", {
    assignmentId,
    provider: provider.name,
    model: provider.model,
    mode: input.examBlueprint ? "blueprint" : "legacy",
    ...(input.examBlueprint
      ? {
          examPattern: input.examBlueprint.examPattern,
          difficultyLevel: input.examBlueprint.difficultyLevel,
          sectionCount: input.examBlueprint.sections.length,
        }
      : {}),
  });

  try {
    const generationResult = input.examBlueprint
      ? await generateBlueprintAssignmentPaper(
          input,
          input.examBlueprint,
          provider,
        )
      : await generateLegacyAssignmentPaper(input, provider);

    retryCount = generationResult.retryCount;

    const durationMs = Date.now() - startedAt;
    const generationMetrics: GenerationMetrics = {
      provider: provider.name,
      model: provider.model,
      durationMs,
      retryCount,
    };

    const result = {
      generatedPaper: generationResult.generatedPaper,
      answerKey: generationResult.answerKey,
      generationMetrics,
    };

    logInfo("[AI][GENERATION] Completed", {
      assignmentId,
      provider: provider.name,
      model: provider.model,
      durationMs,
      mode: input.examBlueprint ? "blueprint" : "legacy",
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message =
      error instanceof Error ? error.message : "Unknown generation error";
    const metrics = buildFailureMetrics(
      provider.name,
      provider.model,
      durationMs,
      retryCount,
      error,
    );

    logError("[AI][GENERATION] Failed", {
      assignmentId,
      provider: provider.name,
      model: provider.model,
      durationMs,
      message,
    });

    throw new AssignmentGenerationError(message, metrics);
  }
}
