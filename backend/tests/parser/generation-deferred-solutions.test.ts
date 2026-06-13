import { buildExamBlueprint } from "../../src/modules/assignment/exam-blueprint.builder";
import { generateAssignmentPaper } from "../../src/services/ai.service";
import { getAIProvider } from "../../src/services/ai/providers";

jest.mock("../../src/services/ai/providers", () => ({
  getAIProvider: jest.fn(),
}));

const mockGetAIProvider = getAIProvider as jest.MockedFunction<
  typeof getAIProvider
>;

describe("generateAssignmentPaper deferred solutions + telemetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts a lean answer key (no explanations) and reports telemetry", async () => {
    const examBlueprint = buildExamBlueprint({
      examPattern: "CUSTOM",
      difficultyLevel: "MEDIUM",
      questionType: "multiple-choice",
      numberOfQuestions: 3,
      marksPerQuestion: 4,
    });

    const section = examBlueprint.sections[0]!;
    const leanResponse = {
      sections: [
        {
          title: section.title,
          instruction: section.instruction,
          questions: Array.from({ length: 3 }, (_, index) => ({
            question: `Question ${index + 1}`,
            difficulty: "medium" as const,
            marks: 4,
            options: ["A", "B", "C", "D"],
          })),
        },
      ],
      answerKey: Array.from({ length: 3 }, (_, index) => ({
        questionNumber: index + 1,
        answer: "A",
      })),
    };

    mockGetAIProvider.mockReturnValue({
      name: "VERTEX",
      model: "gemini-2.5-flash",
      generateAssignment: jest.fn().mockResolvedValue({
        text: JSON.stringify(leanResponse),
        retryCount: 0,
        promptTokens: 120,
        completionTokens: 80,
        totalTokens: 200,
      }),
    } as never);

    const result = await generateAssignmentPaper({
      assignmentId: "assignment-deferred-1",
      title: "Mock",
      topic: "Physics",
      instructions: "Answer all questions.",
      questionConfig: {
        questionType: "multiple-choice",
        numberOfQuestions: 3,
        marksPerQuestion: 4,
        examPattern: "CUSTOM",
        difficultyLevel: "MEDIUM",
      },
      examBlueprint,
    });

    expect(result.answerKeyMode).toBe("STANDARD");
    expect(result.answerKey).toHaveLength(3);
    expect(result.answerKey[0]?.explanation).toBeUndefined();
    expect(result.answerKey[0]?.markingGuide).toBeUndefined();
    expect(result.generatedPaper.sections[0]?.questions[0]?.options).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);

    expect(result.generationMetrics.examType).toBe("CUSTOM");
    expect(result.generationMetrics.questionCount).toBe(3);
    expect(result.generationMetrics.answerKeyMode).toBe("STANDARD");
    expect(result.generationMetrics.promptTokens).toBe(120);
    expect(result.generationMetrics.completionTokens).toBe(80);
  });
});
