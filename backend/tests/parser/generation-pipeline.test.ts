import { generateAssignmentPaper } from "../../src/services/ai.service";
import { getAIProvider } from "../../src/services/ai/providers";
import { AssignmentGenerationError } from "../../src/services/ai/generation-metrics";

jest.mock("../../src/services/ai/providers", () => ({
  getAIProvider: jest.fn(),
}));

const mockGetAIProvider = getAIProvider as jest.MockedFunction<
  typeof getAIProvider
>;

describe("generateAssignmentPaper question count validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when generated question count mismatches the requested count", async () => {
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
        assignmentId: "assignment-1",
        title: "Quiz",
        topic: "Science",
        instructions: "Answer all questions.",
        questionConfig: {
          questionType: "short-answer",
          numberOfQuestions: 3,
          marksPerQuestion: 2,
        },
      }),
    ).rejects.toBeInstanceOf(AssignmentGenerationError);

    await expect(
      generateAssignmentPaper({
        assignmentId: "assignment-1",
        title: "Quiz",
        topic: "Science",
        instructions: "Answer all questions.",
        questionConfig: {
          questionType: "short-answer",
          numberOfQuestions: 3,
          marksPerQuestion: 2,
        },
      }),
    ).rejects.toThrow(/generated 1 questions but 3 were requested/i);
  });
});
