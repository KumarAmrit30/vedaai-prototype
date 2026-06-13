import { buildExamBlueprint } from "../../src/modules/assignment/exam-blueprint.builder";
import {
  buildGenerationBatches,
  computeDifficultyCounts,
  distributeDifficultyCountsAcrossBatches,
  GENERATION_BATCH_SIZE,
  GENERATION_BATCH_THRESHOLD,
  splitQuestionCountIntoBatches,
} from "../../src/services/ai/generation-batch";

describe("splitQuestionCountIntoBatches", () => {
  it("returns a single batch when the section is at or below the threshold", () => {
    expect(splitQuestionCountIntoBatches(20)).toEqual([20]);
    expect(splitQuestionCountIntoBatches(10)).toEqual([10]);
  });

  it("splits large sections into batches of 15", () => {
    expect(splitQuestionCountIntoBatches(45)).toEqual([15, 15, 15]);
    expect(splitQuestionCountIntoBatches(90)).toEqual([
      15, 15, 15, 15, 15, 15,
    ]);
    expect(splitQuestionCountIntoBatches(21)).toEqual([15, 6]);
  });
});

describe("computeDifficultyCounts", () => {
  it("computes exact section-level counts from percentages", () => {
    expect(
      computeDifficultyCounts(45, { easy: 20, medium: 55, hard: 25 }),
    ).toEqual({ easy: 9, medium: 25, hard: 11 });
  });
});

describe("distributeDifficultyCountsAcrossBatches", () => {
  it("preserves exact section totals across batches", () => {
    const sectionCounts = computeDifficultyCounts(45, {
      easy: 20,
      medium: 55,
      hard: 25,
    });
    const batchSizes = splitQuestionCountIntoBatches(45);
    const distributed = distributeDifficultyCountsAcrossBatches(
      sectionCounts,
      batchSizes,
    );

    expect(distributed).toHaveLength(3);
    expect(distributed.reduce((sum, batch) => sum + batch.easy, 0)).toBe(9);
    expect(distributed.reduce((sum, batch) => sum + batch.medium, 0)).toBe(25);
    expect(distributed.reduce((sum, batch) => sum + batch.hard, 0)).toBe(11);

    for (let index = 0; index < batchSizes.length; index += 1) {
      const counts = distributed[index]!;
      const batchSize = batchSizes[index]!;
      expect(counts.easy + counts.medium + counts.hard).toBe(batchSize);
    }
  });
});

describe("buildGenerationBatches", () => {
  it("builds batched plans for NEET without changing user-visible section count", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "NEET",
      difficultyLevel: "MIXED",
    });

    const batches = buildGenerationBatches(blueprint);

    expect(blueprint.sections).toHaveLength(3);
    expect(batches).toHaveLength(12);

    const physicsBatches = batches.filter((batch) => batch.section.subject === "Physics");
    const chemistryBatches = batches.filter(
      (batch) => batch.section.subject === "Chemistry",
    );
    const biologyBatches = batches.filter(
      (batch) => batch.section.subject === "Biology",
    );

    expect(physicsBatches).toHaveLength(3);
    expect(chemistryBatches).toHaveLength(3);
    expect(biologyBatches).toHaveLength(6);

    for (const batch of batches) {
      expect(batch.questionCount).toBeLessThanOrEqual(GENERATION_BATCH_SIZE);
    }

    expect(physicsBatches[0]?.globalQuestionOffset).toBe(0);
    expect(chemistryBatches[0]?.globalQuestionOffset).toBe(45);
    expect(biologyBatches[0]?.globalQuestionOffset).toBe(90);
    expect(biologyBatches.at(-1)?.globalQuestionOffset).toBe(165);
  });

  it("keeps small sections as a single batch", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "CBSE",
      difficultyLevel: "MIXED",
    });

    const batches = buildGenerationBatches(blueprint);

    expect(batches).toHaveLength(3);
    for (const batch of batches) {
      expect(batch.batchCount).toBe(1);
      expect(batch.questionCount).toBeLessThanOrEqual(GENERATION_BATCH_THRESHOLD);
    }
  });
});

describe("batching constants", () => {
  it("uses a batch size of 15 and threshold above 20", () => {
    expect(GENERATION_BATCH_SIZE).toBe(15);
    expect(GENERATION_BATCH_THRESHOLD).toBe(20);
  });
});
