import { buildExamBlueprint } from "../../src/modules/assignment/exam-blueprint.builder";
import type { ExamBlueprint } from "../../src/modules/assignment/exam-blueprint.types";
import { generateAssignmentPaper } from "../../src/services/ai.service";
import { getAIProvider } from "../../src/services/ai/providers";
import { AssignmentGenerationError } from "../../src/services/ai/generation-metrics";
import type { AssignmentResponse } from "../../src/services/ai/response-parser";

jest.mock("../../src/services/ai/providers", () => ({
  getAIProvider: jest.fn(),
}));

const mockGetAIProvider = getAIProvider as jest.MockedFunction<
  typeof getAIProvider
>;

function buildSectionResponse(
  blueprintSection: ExamBlueprint["sections"][number],
): AssignmentResponse {
  const questions = Array.from(
    { length: blueprintSection.numberOfQuestions },
    (_, index) => ({
      question: `${blueprintSection.title} — Question ${index + 1}`,
      difficulty: "medium" as const,
      marks: blueprintSection.marksPerQuestion,
    }),
  );

  const answerKey = Array.from(
    { length: blueprintSection.numberOfQuestions },
    (_, index) => ({
      questionNumber: index + 1,
      answer: `Answer ${index + 1}`,
      explanation: `Explanation ${index + 1}`,
      markingGuide: `Guide ${index + 1}`,
    }),
  );

  return {
    sections: [
      {
        title: blueprintSection.title,
        instruction: blueprintSection.instruction,
        questions,
      },
    ],
    answerKey,
  };
}

function mockProviderForBlueprint(blueprint: ExamBlueprint) {
  const generateAssignment = jest
    .fn()
    .mockImplementation(async () => {
      const callIndex = generateAssignment.mock.calls.length - 1;
      const section = blueprint.sections[callIndex];

      if (!section) {
        throw new Error("Unexpected provider call");
      }

      return {
        text: JSON.stringify(buildSectionResponse(section)),
        retryCount: 0,
      };
    });

  mockGetAIProvider.mockReturnValue({
    name: "GEMINI",
    model: "gemini-2.5-flash",
    generateAssignment,
  });

  return generateAssignment;
}

const baseInput = {
  assignmentId: "assignment-blueprint-1",
  title: "Unit Test",
  topic: "Physics",
  instructions: "Answer all questions.",
};

describe("generateAssignmentPaper blueprint generation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates a CBSE blueprint paper section-by-section", async () => {
    const examBlueprint = buildExamBlueprint({
      examPattern: "CBSE",
      difficultyLevel: "MIXED",
    });
    const generateAssignment = mockProviderForBlueprint(examBlueprint);

    const result = await generateAssignmentPaper({
      ...baseInput,
      questionConfig: {
        questionType: "multiple-choice",
        numberOfQuestions: examBlueprint.totalQuestions,
        marksPerQuestion: 1,
        examPattern: "CBSE",
        difficultyLevel: "MIXED",
      },
      examBlueprint,
    });

    expect(generateAssignment).toHaveBeenCalledTimes(3);
    expect(result.generatedPaper.sections).toHaveLength(3);
    expect(result.generatedPaper.sections[0]?.title).toBe(
      examBlueprint.sections[0]?.title,
    );
    expect(result.generatedPaper.sections[1]?.questions).toHaveLength(10);
    expect(result.generatedPaper.sections[2]?.questions).toHaveLength(5);
    expect(result.answerKey).toHaveLength(examBlueprint.totalQuestions);
    expect(result.answerKey[0]?.questionNumber).toBe(1);
    expect(result.answerKey.at(-1)?.questionNumber).toBe(
      examBlueprint.totalQuestions,
    );
  });

  it("generates a UNIVERSITY blueprint paper section-by-section", async () => {
    const examBlueprint = buildExamBlueprint({
      examPattern: "UNIVERSITY",
      difficultyLevel: "HARD",
    });
    const generateAssignment = mockProviderForBlueprint(examBlueprint);

    const result = await generateAssignmentPaper({
      ...baseInput,
      questionConfig: {
        questionType: "multiple-choice",
        numberOfQuestions: examBlueprint.totalQuestions,
        marksPerQuestion: 2,
        examPattern: "UNIVERSITY",
        difficultyLevel: "HARD",
      },
      examBlueprint,
    });

    expect(generateAssignment).toHaveBeenCalledTimes(3);
    expect(result.generatedPaper.sections).toHaveLength(3);
    expect(result.generatedPaper.sections[2]?.questions).toHaveLength(3);
    expect(result.answerKey).toHaveLength(examBlueprint.totalQuestions);
  });

  it("generates a CUSTOM blueprint paper using its single section definition", async () => {
    const examBlueprint = buildExamBlueprint({
      examPattern: "CUSTOM",
      difficultyLevel: "MEDIUM",
      questionType: "short-answer",
      numberOfQuestions: 4,
      marksPerQuestion: 5,
    });
    const generateAssignment = mockProviderForBlueprint(examBlueprint);

    const result = await generateAssignmentPaper({
      ...baseInput,
      questionConfig: {
        questionType: "short-answer",
        numberOfQuestions: 4,
        marksPerQuestion: 5,
        examPattern: "CUSTOM",
        difficultyLevel: "MEDIUM",
      },
      examBlueprint,
    });

    expect(generateAssignment).toHaveBeenCalledTimes(1);
    expect(result.generatedPaper.sections).toHaveLength(1);
    expect(result.generatedPaper.sections[0]?.questions).toHaveLength(4);
    expect(result.generatedPaper.sections[0]?.questions.every((q) => q.marks === 5)).toBe(
      true,
    );
    expect(result.answerKey).toHaveLength(4);
  });

  it("throws when a blueprint section response contains the wrong section count", async () => {
    const examBlueprint = buildExamBlueprint({
      examPattern: "CUSTOM",
      difficultyLevel: "EASY",
      questionType: "short-answer",
      numberOfQuestions: 2,
      marksPerQuestion: 3,
    });
    const section = examBlueprint.sections[0]!;
    const validSection = buildSectionResponse(section).sections[0]!;

    mockGetAIProvider.mockReturnValue({
      name: "GEMINI",
      model: "gemini-2.5-flash",
      generateAssignment: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          sections: [validSection, validSection],
          answerKey: [
            {
              questionNumber: 1,
              answer: "Answer 1",
              explanation: "Explanation 1",
              markingGuide: "Guide 1",
            },
            {
              questionNumber: 2,
              answer: "Answer 2",
              explanation: "Explanation 2",
              markingGuide: "Guide 2",
            },
            {
              questionNumber: 3,
              answer: "Answer 3",
              explanation: "Explanation 3",
              markingGuide: "Guide 3",
            },
            {
              questionNumber: 4,
              answer: "Answer 4",
              explanation: "Explanation 4",
              markingGuide: "Guide 4",
            },
          ],
        }),
        retryCount: 0,
      }),
    });

    await expect(
      generateAssignmentPaper({
        ...baseInput,
        questionConfig: {
          questionType: "short-answer",
          numberOfQuestions: 2,
          marksPerQuestion: 3,
        },
        examBlueprint,
      }),
    ).rejects.toBeInstanceOf(AssignmentGenerationError);

    await expect(
      generateAssignmentPaper({
        ...baseInput,
        questionConfig: {
          questionType: "short-answer",
          numberOfQuestions: 2,
          marksPerQuestion: 3,
        },
        examBlueprint,
      }),
    ).rejects.toThrow(/expected 1 section/i);
  });

  it("throws when a blueprint section response contains the wrong question count", async () => {
    const examBlueprint = buildExamBlueprint({
      examPattern: "CUSTOM",
      difficultyLevel: "EASY",
      questionType: "short-answer",
      numberOfQuestions: 3,
      marksPerQuestion: 2,
    });
    const section = examBlueprint.sections[0]!;

    mockGetAIProvider.mockReturnValue({
      name: "GEMINI",
      model: "gemini-2.5-flash",
      generateAssignment: jest.fn().mockResolvedValue({
        text: JSON.stringify(
          buildSectionResponse({
            ...section,
            numberOfQuestions: 1,
          }),
        ),
        retryCount: 0,
      }),
    });

    await expect(
      generateAssignmentPaper({
        ...baseInput,
        questionConfig: {
          questionType: "short-answer",
          numberOfQuestions: 3,
          marksPerQuestion: 2,
        },
        examBlueprint,
      }),
    ).rejects.toBeInstanceOf(AssignmentGenerationError);

    await expect(
      generateAssignmentPaper({
        ...baseInput,
        questionConfig: {
          questionType: "short-answer",
          numberOfQuestions: 3,
          marksPerQuestion: 2,
        },
        examBlueprint,
      }),
    ).rejects.toThrow(/expected 3 questions but generated 1/i);
  });
});

describe("generateAssignmentPaper legacy generation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("still validates legacy assignments against flat questionConfig", async () => {
    mockGetAIProvider.mockReturnValue({
      name: "GEMINI",
      model: "gemini-2.5-flash",
      generateAssignment: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          sections: [
            {
              title: "Section A",
              instruction: "Answer all questions.",
              questions: [
                {
                  question: "Only one question",
                  difficulty: "easy",
                  marks: 2,
                },
              ],
            },
          ],
          answerKey: [
            {
              questionNumber: 1,
              answer: "A",
              explanation: "Because",
              markingGuide: "Full marks",
            },
          ],
        }),
        retryCount: 0,
      }),
    });

    await expect(
      generateAssignmentPaper({
        ...baseInput,
        questionConfig: {
          questionType: "short-answer",
          numberOfQuestions: 3,
          marksPerQuestion: 2,
        },
      }),
    ).rejects.toThrow(/generated 1 questions but 3 were requested/i);
  });
});
