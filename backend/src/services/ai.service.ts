import { env } from "../config/env";
import type {
  AnswerKeyEntry,
  AnswerKeyMode,
  ExamBlueprint,
  GeneratedPaper,
  GenerationMetrics,
} from "../modules/assignment/assignment.types";
import { getAIProvider } from "./ai/providers";
import type { ProviderGenerationResult } from "./ai/interfaces/AIProvider";
import {
  AssignmentGenerationError,
  classifyGenerationError,
} from "./ai/generation-metrics";
import { buildAssignmentPrompt } from "./ai/assignment-prompt.builder";
import type { BuildPromptBatchContext } from "./ai/assignment-prompt.builder";
import type {
  AssignmentGenerationInput,
  AssignmentGenerationResult,
} from "./ai/assignment-generation.types";
import {
  normalizeSectionFromBlueprint,
  validateBatchResponseAgainstBlueprint,
  validateMergedPaperAgainstBlueprint,
} from "./ai/blueprint-response.validator";
import { buildGenerationBatches } from "./ai/generation-batch";
import { parseAIResponse } from "./ai/response-parser";
import { logDebug, logError, logInfo } from "../utils/logger";

export type { AssignmentGenerationInput, AssignmentGenerationResult } from "./ai/assignment-generation.types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function accumulateTokenMetrics(
  metrics: GenerationMetrics,
  providerResult: ProviderGenerationResult,
): void {
  if (providerResult.promptTokens !== undefined) {
    metrics.promptTokens =
      (metrics.promptTokens ?? 0) + providerResult.promptTokens;
  }

  if (providerResult.completionTokens !== undefined) {
    metrics.completionTokens =
      (metrics.completionTokens ?? 0) + providerResult.completionTokens;
  }

  if (providerResult.totalTokens !== undefined) {
    metrics.totalTokens =
      (metrics.totalTokens ?? 0) + providerResult.totalTokens;
  }

  if (providerResult.thoughtsTokens !== undefined) {
    metrics.thoughtsTokens =
      (metrics.thoughtsTokens ?? 0) + providerResult.thoughtsTokens;
  }
}

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

function resolveAnswerKeyMode(input: AssignmentGenerationInput): AnswerKeyMode {
  return (
    input.examBlueprint?.answerKeyMode ??
    input.questionConfig.answerKeyMode ??
    "STANDARD"
  );
}

function resolveExamType(input: AssignmentGenerationInput): string {
  return (
    input.examBlueprint?.examPattern ??
    input.questionConfig.examPattern ??
    "CUSTOM"
  );
}

function countAnswerKey(answerKey: AnswerKeyEntry[]): number {
  return answerKey.length;
}

async function generateLegacyAssignmentPaper(
  input: AssignmentGenerationInput,
  provider: ReturnType<typeof getAIProvider>,
): Promise<{
  generatedPaper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
  retryCount: number;
  providerResult: ProviderGenerationResult;
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
    providerResult,
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
  providerResults: ProviderGenerationResult[];
}> {
  const mergedSections: GeneratedPaper["sections"] = [];
  const mergedAnswerKey: AnswerKeyEntry[] = [];
  const providerResults: ProviderGenerationResult[] = [];
  let retryCount = 0;

  // Flat batch plan — sections with >20 questions are split into 15-question
  // slices. Execution is sequential today; each batch is an independent retry
  // unit. Future parallel workers can claim batches by index without changing
  // merge semantics (preserve sectionIndex + batchIndex ordering).
  const generationBatches = buildGenerationBatches(blueprint);
  const batchesBySection = new Map<number, typeof generationBatches>();

  for (const batch of generationBatches) {
    const existing = batchesBySection.get(batch.sectionIndex) ?? [];
    existing.push(batch);
    batchesBySection.set(batch.sectionIndex, existing);
  }

  for (let sectionIndex = 0; sectionIndex < blueprint.sections.length; sectionIndex += 1) {
    if (sectionIndex > 0 && env.vertexSectionDelayMs > 0) {
      await sleep(env.vertexSectionDelayMs);
    }

    const section = blueprint.sections[sectionIndex];
    if (!section) continue;

    const sectionBatches = batchesBySection.get(sectionIndex) ?? [];
    const sectionStartedAt = Date.now();
    let sectionPromptTokens = 0;
    let sectionCompletionTokens = 0;
    let sectionDurationMs = 0;
    let sectionRetryCount = 0;
    let hasSectionPromptTokens = false;
    let hasSectionCompletionTokens = false;

    const mergedQuestions: GeneratedPaper["sections"][number]["questions"] = [];

    for (const batch of sectionBatches) {
      const batchStartedAt = Date.now();

      const sectionContext = {
        section: batch.section,
        sectionIndex: batch.sectionIndex,
        totalSections: blueprint.sections.length,
        globalQuestionOffset: batch.globalQuestionOffset,
      };

      let batchContext: BuildPromptBatchContext | undefined;
      if (batch.batchCount > 1) {
        batchContext = {
          ...sectionContext,
          batchIndex: batch.batchIndex,
          batchCount: batch.batchCount,
          batchQuestionCount: batch.questionCount,
          batchDifficultyCounts: batch.difficultyCounts,
          batchGlobalQuestionOffset: batch.globalQuestionOffset,
        };
      }

      const prompt = buildAssignmentPrompt(input, sectionContext, batchContext);

      // Each batch is one provider call; retryAIRequest inside the provider
      // retries only this batch on transient failure — never the whole section.
      const providerResult = await provider.generateAssignment(prompt);
      providerResults.push(providerResult);
      retryCount += providerResult.retryCount;
      sectionRetryCount += providerResult.retryCount;

      const structured = parseAIResponse(providerResult.text);
      validateBatchResponseAgainstBlueprint(
        structured,
        blueprint,
        batch.sectionIndex,
        batch.questionCount,
      );

      const parsedSection = structured.sections[0];
      if (!parsedSection) {
        throw new Error(
          `AI response validation failed: Section ${batch.sectionIndex + 1} batch ${batch.batchIndex + 1} is missing from provider response`,
        );
      }

      mergedQuestions.push(...parsedSection.questions);
      mergedAnswerKey.push(
        ...offsetAnswerKeyEntries(
          structured.answerKey,
          batch.globalQuestionOffset,
        ),
      );

      const batchDurationMs = Date.now() - batchStartedAt;
      sectionDurationMs += batchDurationMs;

      if (providerResult.promptTokens !== undefined) {
        sectionPromptTokens += providerResult.promptTokens;
        hasSectionPromptTokens = true;
      }
      if (providerResult.completionTokens !== undefined) {
        sectionCompletionTokens += providerResult.completionTokens;
        hasSectionCompletionTokens = true;
      }

      logInfo("[TELEMETRY][BATCH]", {
        assignmentId: input.assignmentId,
        sectionIndex: batch.sectionIndex + 1,
        sectionTitle: batch.section.title,
        batchIndex: batch.batchIndex + 1,
        batchCount: batch.batchCount,
        questionsInBatch: batch.questionCount,
        promptTokens: providerResult.promptTokens,
        completionTokens: providerResult.completionTokens,
        durationMs: batchDurationMs,
        retryCount: providerResult.retryCount,
      });

      logDebug(`[AI][${provider.name}] Blueprint batch validated`, {
        sectionIndex: batch.sectionIndex + 1,
        batchIndex: batch.batchIndex + 1,
        batchCount: batch.batchCount,
        questions: batch.questionCount,
      });
    }

    mergedSections.push(
      normalizeSectionFromBlueprint(
        {
          title: section.title,
          instruction: section.instruction,
          questions: mergedQuestions,
        },
        section,
      ),
    );

    logInfo("[TELEMETRY][SECTION]", {
      assignmentId: input.assignmentId,
      sectionIndex: sectionIndex + 1,
      sectionTitle: section.title,
      batchCount: sectionBatches.length,
      totalQuestions: section.numberOfQuestions,
      promptTokens: hasSectionPromptTokens ? sectionPromptTokens : undefined,
      completionTokens: hasSectionCompletionTokens
        ? sectionCompletionTokens
        : undefined,
      durationMs: sectionDurationMs,
      retryCount: sectionRetryCount,
    });
  }

  validateMergedPaperAgainstBlueprint(mergedSections, blueprint);

  logDebug(`[AI][${provider.name}] Blueprint paper validated`, {
    sections: mergedSections.length,
    questions: blueprint.totalQuestions,
    answerKeyEntries: mergedAnswerKey.length,
    generationBatches: generationBatches.length,
  });

  return {
    generatedPaper: { sections: mergedSections },
    answerKey: mergedAnswerKey,
    retryCount,
    providerResults,
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
    const answerKeyMode = resolveAnswerKeyMode(input);
    const generationMetrics: GenerationMetrics = {
      provider: provider.name,
      model: provider.model,
      durationMs,
      retryCount,
      examType: resolveExamType(input),
      questionCount: countAnswerKey(generationResult.answerKey),
      answerKeyMode,
    };

    if ("providerResult" in generationResult) {
      accumulateTokenMetrics(generationMetrics, generationResult.providerResult);
    } else {
      for (const providerResult of generationResult.providerResults) {
        accumulateTokenMetrics(generationMetrics, providerResult);
      }
    }

    const result = {
      generatedPaper: generationResult.generatedPaper,
      answerKey: generationResult.answerKey,
      answerKeyMode,
      generationMetrics,
    };

    // Phase 7 — structured telemetry for cost analysis.
    logInfo("[TELEMETRY][GENERATION]", {
      assignmentId,
      provider: provider.name,
      model: provider.model,
      examType: generationMetrics.examType,
      questionCount: generationMetrics.questionCount,
      answerKeyMode: generationMetrics.answerKeyMode,
      promptTokens: generationMetrics.promptTokens,
      completionTokens: generationMetrics.completionTokens,
      totalTokens: generationMetrics.totalTokens,
      thoughtsTokens: generationMetrics.thoughtsTokens,
      durationMs,
      retryCount,
      mode: input.examBlueprint ? "blueprint" : "legacy",
    });

    logInfo("[AI][GENERATION] Completed", {
      assignmentId,
      provider: provider.name,
      model: provider.model,
      durationMs,
      retryCount,
      promptTokens: generationMetrics.promptTokens,
      completionTokens: generationMetrics.completionTokens,
      totalTokens: generationMetrics.totalTokens,
      thoughtsTokens: generationMetrics.thoughtsTokens,
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
