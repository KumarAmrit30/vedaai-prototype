import { generateAssignmentSolutions } from "../../src/services/ai/solutions.service";
import { getAIProvider } from "../../src/services/ai/providers";
import type {
  AnswerKeyEntry,
  GeneratedPaper,
} from "../../src/modules/assignment/assignment.types";

jest.mock("../../src/services/ai/providers", () => ({
  getAIProvider: jest.fn(),
}));

const mockGetAIProvider = getAIProvider as jest.MockedFunction<
  typeof getAIProvider
>;

const generatedPaper: GeneratedPaper = {
  sections: [
    {
      title: "Physics",
      subject: "Physics",
      instruction: "Select the correct option.",
      questions: [
        {
          question: "Q1",
          difficulty: "medium",
          marks: 4,
          options: ["A", "B", "C", "D"],
        },
        {
          question: "Q2",
          difficulty: "hard",
          marks: 4,
          options: ["A", "B", "C", "D"],
        },
      ],
    },
  ],
};

const answerKey: AnswerKeyEntry[] = [
  { questionNumber: 1, answer: "A" },
  { questionNumber: 2, answer: "C" },
];

describe("generateAssignmentSolutions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds explanations for STANDARD mode", async () => {
    mockGetAIProvider.mockReturnValue({
      name: "VERTEX",
      model: "gemini-2.5-flash",
      generateAssignment: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          solutions: [
            { questionNumber: 1, explanation: "Because A" },
            { questionNumber: 2, explanation: "Because C" },
          ],
        }),
        retryCount: 0,
        promptTokens: 50,
        completionTokens: 40,
      }),
    } as never);

    const result = await generateAssignmentSolutions({
      assignmentId: "a1",
      title: "Mock",
      topic: "Physics",
      instructions: "Answer all.",
      answerKeyMode: "STANDARD",
      generatedPaper,
      answerKey,
    });

    expect(result.answerKey[0]?.explanation).toBe("Because A");
    expect(result.answerKey[1]?.explanation).toBe("Because C");
    expect(result.answerKey[0]?.markingGuide).toBeUndefined();
    expect(result.promptTokens).toBe(50);
  });

  it("adds explanation, markingGuide, and rubric for DETAILED mode", async () => {
    mockGetAIProvider.mockReturnValue({
      name: "VERTEX",
      model: "gemini-2.5-flash",
      generateAssignment: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          solutions: [
            {
              questionNumber: 1,
              explanation: "Because A",
              markingGuide: "Full marks for A",
              rubric: "1 mark correct option",
            },
            {
              questionNumber: 2,
              explanation: "Because C",
              markingGuide: "Full marks for C",
              rubric: "1 mark correct option",
            },
          ],
        }),
        retryCount: 0,
      }),
    } as never);

    const result = await generateAssignmentSolutions({
      assignmentId: "a1",
      title: "Mock",
      topic: "Physics",
      instructions: "Answer all.",
      answerKeyMode: "DETAILED",
      generatedPaper,
      answerKey,
    });

    expect(result.answerKey[0]?.markingGuide).toBe("Full marks for A");
    expect(result.answerKey[0]?.rubric).toBe("1 mark correct option");
  });
});
