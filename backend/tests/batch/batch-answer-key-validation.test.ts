import { buildExamBlueprint } from "../../src/modules/assignment/exam-blueprint.builder";
import {
  buildGenerationBatches,
  type GenerationBatch,
} from "../../src/services/ai/generation-batch";
import { parseAIResponse } from "../../src/services/ai/response-parser";

function buildBatchPayload(
  batch: GenerationBatch,
  numbering: "global" | "local",
): string {
  const startNumber =
    numbering === "global" ? batch.globalQuestionOffset + 1 : 1;

  const questions = Array.from(
    { length: batch.questionCount },
    (_, index) => ({
      question: `Physics Q${startNumber + index}`,
      difficulty: "medium" as const,
      marks: batch.section.marksPerQuestion,
    }),
  );

  const answerKey = Array.from({ length: batch.questionCount }, (_, index) => ({
    questionNumber: startNumber + index,
    answer: `Answer ${startNumber + index}`,
  }));

  return JSON.stringify({
    sections: [
      {
        title: batch.section.title,
        instruction: batch.section.instruction,
        questions,
      },
    ],
    answerKey,
  });
}

function mergeBatchAnswerKeys(batches: GenerationBatch[]): number[] {
  const merged: number[] = [];

  for (const batch of batches) {
    const payload = buildBatchPayload(batch, "global");
    const parsed = parseAIResponse(payload, {
      answerKeyStartNumber: batch.globalQuestionOffset + 1,
    });
    merged.push(...parsed.answerKey.map((entry) => entry.questionNumber));
  }

  return merged;
}

describe("batch answer-key validation (global numbering)", () => {
  const neetBlueprint = buildExamBlueprint({
    examPattern: "NEET",
    answerKeyMode: "BASIC",
  });

  const physicsBatches = buildGenerationBatches(neetBlueprint).filter(
    (batch) => batch.section.title === "Physics",
  );

  it("accepts Physics batch 1 answerKey numbered 1–15", () => {
    const batch = physicsBatches[0];
    expect(batch).toBeDefined();
    expect(batch?.globalQuestionOffset).toBe(0);
    expect(batch?.questionCount).toBe(15);

    const result = parseAIResponse(buildBatchPayload(batch!, "global"), {
      answerKeyStartNumber: 1,
    });

    expect(result.answerKey.map((entry) => entry.questionNumber)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
  });

  it("accepts Physics batch 2 answerKey numbered 16–30", () => {
    const batch = physicsBatches[1];
    expect(batch).toBeDefined();
    expect(batch?.globalQuestionOffset).toBe(15);
    expect(batch?.questionCount).toBe(15);

    const result = parseAIResponse(buildBatchPayload(batch!, "global"), {
      answerKeyStartNumber: 16,
    });

    expect(result.answerKey.map((entry) => entry.questionNumber)).toEqual(
      Array.from({ length: 15 }, (_, index) => 16 + index),
    );
  });

  it("accepts Physics batch 3 answerKey numbered 31–45", () => {
    const batch = physicsBatches[2];
    expect(batch).toBeDefined();
    expect(batch?.globalQuestionOffset).toBe(30);
    expect(batch?.questionCount).toBe(15);

    const result = parseAIResponse(buildBatchPayload(batch!, "global"), {
      answerKeyStartNumber: 31,
    });

    expect(result.answerKey.map((entry) => entry.questionNumber)).toEqual(
      Array.from({ length: 15 }, (_, index) => 31 + index),
    );
  });

  it("rejects batch-local numbering (1–15) when global range 16–30 is expected", () => {
    const batch = physicsBatches[1];
    expect(batch).toBeDefined();

    expect(() =>
      parseAIResponse(buildBatchPayload(batch!, "local"), {
        answerKeyStartNumber: 16,
      }),
    ).toThrow(/sequential from 16 to 30/i);
  });

  it("merges Physics batches into sequential answerKey 1–45 without double offset", () => {
    const merged = mergeBatchAnswerKeys(physicsBatches);

    expect(merged).toHaveLength(45);
    expect(merged).toEqual(Array.from({ length: 45 }, (_, index) => index + 1));
  });

  it("merges full NEET paper into sequential answerKey 1–180", () => {
    const allBatches = buildGenerationBatches(neetBlueprint);
    const merged = mergeBatchAnswerKeys(allBatches);

    expect(merged).toHaveLength(180);
    expect(merged).toEqual(
      Array.from({ length: 180 }, (_, index) => index + 1),
    );
  });

  it("non-batched default parser still requires answerKey 1–N", () => {
    const batch = physicsBatches[1]!;
    const payload = buildBatchPayload(batch, "global");

    expect(() => parseAIResponse(payload)).toThrow(
      /sequential from 1 to the total question count/i,
    );
  });
});
