import type {
  BlueprintSectionDefinition,
  DifficultyDistribution,
  DifficultyLevel,
  ExamBlueprint,
} from "../../modules/assignment/exam-blueprint.types";

/** Maximum questions generated in a single Vertex call. */
export const GENERATION_BATCH_SIZE = 15;

/** Sections with more than this count are split into batches. */
export const GENERATION_BATCH_THRESHOLD = 20;

export interface DifficultyCounts {
  easy: number;
  medium: number;
  hard: number;
}

/**
 * One internal generation unit. Batching is invisible to users — multiple
 * batches for the same blueprint section are merged before persistence.
 *
 * Future parallel execution: each `GenerationBatch` is an independent unit of
 * work. A worker pool can process batches concurrently as long as merge order
 * is preserved by `batchIndex` within each section.
 */
export interface GenerationBatch {
  sectionIndex: number;
  section: BlueprintSectionDefinition;
  batchIndex: number;
  batchCount: number;
  questionCount: number;
  /** Global question number of the first question in this batch (1-based). */
  globalQuestionOffset: number;
  difficultyCounts: DifficultyCounts;
}

export function computeDifficultyCounts(
  total: number,
  distribution: DifficultyDistribution,
): DifficultyCounts {
  const easy = Math.round((total * distribution.easy) / 100);
  const hard = Math.round((total * distribution.hard) / 100);
  const medium = Math.max(0, total - easy - hard);
  return { easy, medium, hard };
}

/**
 * Split a section question count into batch sizes. Sections at or below the
 * threshold are returned as a single batch regardless of size.
 */
export function splitQuestionCountIntoBatches(
  sectionQuestionCount: number,
): number[] {
  if (sectionQuestionCount <= GENERATION_BATCH_THRESHOLD) {
    return [sectionQuestionCount];
  }

  const batches: number[] = [];
  let remaining = sectionQuestionCount;

  while (remaining > 0) {
    const size = Math.min(GENERATION_BATCH_SIZE, remaining);
    batches.push(size);
    remaining -= size;
  }

  return batches;
}

/**
 * Distribute exact section-level difficulty counts across batches using the
 * largest-remainder method so batch totals always sum to the section totals.
 */
export function distributeDifficultyCountsAcrossBatches(
  sectionCounts: DifficultyCounts,
  batchSizes: number[],
): DifficultyCounts[] {
  const sectionTotal = batchSizes.reduce((sum, size) => sum + size, 0);

  if (sectionTotal === 0 || batchSizes.length === 0) {
    return [];
  }

  if (batchSizes.length === 1) {
    return [sectionCounts];
  }

  const allocateLevel = (levelTotal: number): number[] => {
    const provisional = batchSizes.map((size) => {
      const exact = (levelTotal * size) / sectionTotal;
      const floor = Math.floor(exact);
      return { floor, remainder: exact - floor };
    });

    let assigned = provisional.reduce((sum, entry) => sum + entry.floor, 0);
    let remaining = levelTotal - assigned;

    const ranked = provisional
      .map((entry, index) => ({ index, remainder: entry.remainder }))
      .sort((a, b) => b.remainder - a.remainder);

    const allocations = provisional.map((entry) => entry.floor);

    for (let rank = 0; rank < ranked.length && remaining > 0; rank += 1) {
      const target = ranked[rank];
      if (!target) continue;
      allocations[target.index] = (allocations[target.index] ?? 0) + 1;
      remaining -= 1;
    }

    return allocations;
  };

  const easyAlloc = allocateLevel(sectionCounts.easy);
  const mediumAlloc = allocateLevel(sectionCounts.medium);
  const hardAlloc = allocateLevel(sectionCounts.hard);

  return batchSizes.map((size, index) => {
    const counts: DifficultyCounts = {
      easy: easyAlloc[index] ?? 0,
      medium: mediumAlloc[index] ?? 0,
      hard: hardAlloc[index] ?? 0,
    };

    const total = counts.easy + counts.medium + counts.hard;
    if (total !== size) {
      counts.medium = Math.max(0, counts.medium + (size - total));
    }

    return counts;
  });
}

function resolveSectionDifficultyCounts(
  sectionQuestionCount: number,
  blueprint: ExamBlueprint,
): DifficultyCounts {
  if (blueprint.difficultyLevel === "EASY") {
    return { easy: sectionQuestionCount, medium: 0, hard: 0 };
  }
  if (blueprint.difficultyLevel === "MEDIUM") {
    return { easy: 0, medium: sectionQuestionCount, hard: 0 };
  }
  if (blueprint.difficultyLevel === "HARD") {
    return { easy: 0, medium: 0, hard: sectionQuestionCount };
  }

  const distribution = blueprint.difficultyDistribution ?? {
    easy: 30,
    medium: 50,
    hard: 20,
  };

  return computeDifficultyCounts(sectionQuestionCount, distribution);
}

/**
 * Build the flat, sequential list of generation batches for an entire
 * blueprint. Execution order matches array order (section-major, batch-minor).
 */
export function buildGenerationBatches(
  blueprint: ExamBlueprint,
): GenerationBatch[] {
  const batches: GenerationBatch[] = [];
  let globalQuestionOffset = 0;

  for (
    let sectionIndex = 0;
    sectionIndex < blueprint.sections.length;
    sectionIndex += 1
  ) {
    const section = blueprint.sections[sectionIndex];
    if (!section) continue;

    const batchSizes = splitQuestionCountIntoBatches(section.numberOfQuestions);
    const sectionDifficultyCounts = resolveSectionDifficultyCounts(
      section.numberOfQuestions,
      blueprint,
    );
    const batchDifficultyCounts = distributeDifficultyCountsAcrossBatches(
      sectionDifficultyCounts,
      batchSizes,
    );

    let sectionLocalOffset = 0;

    for (let batchIndex = 0; batchIndex < batchSizes.length; batchIndex += 1) {
      const questionCount = batchSizes[batchIndex] ?? 0;
      if (questionCount === 0) continue;

      batches.push({
        sectionIndex,
        section,
        batchIndex,
        batchCount: batchSizes.length,
        questionCount,
        globalQuestionOffset: globalQuestionOffset + sectionLocalOffset,
        difficultyCounts:
          batchDifficultyCounts[batchIndex] ?? {
            easy: 0,
            medium: questionCount,
            hard: 0,
          },
      });

      sectionLocalOffset += questionCount;
    }

    globalQuestionOffset += section.numberOfQuestions;
  }

  return batches;
}

export function formatDifficultyCounts(counts: DifficultyCounts): string {
  return `${counts.easy} easy, ${counts.medium} medium, ${counts.hard} hard`;
}

export function isMixedDifficultyLevel(level: DifficultyLevel): boolean {
  return level === "MIXED";
}
