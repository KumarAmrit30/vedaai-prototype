"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_service_1 = require("../../src/services/ai.service");
const providers_1 = require("../../src/services/ai/providers");
const generation_metrics_1 = require("../../src/services/ai/generation-metrics");
jest.mock("../../src/services/ai/providers", () => ({
    getAIProvider: jest.fn(),
}));
const mockGetAIProvider = providers_1.getAIProvider;
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
        await expect((0, ai_service_1.generateAssignmentPaper)({
            assignmentId: "assignment-1",
            title: "Quiz",
            topic: "Science",
            instructions: "Answer all questions.",
            questionConfig: {
                questionType: "short-answer",
                numberOfQuestions: 3,
                marksPerQuestion: 2,
            },
        })).rejects.toBeInstanceOf(generation_metrics_1.AssignmentGenerationError);
        await expect((0, ai_service_1.generateAssignmentPaper)({
            assignmentId: "assignment-1",
            title: "Quiz",
            topic: "Science",
            instructions: "Answer all questions.",
            questionConfig: {
                questionType: "short-answer",
                numberOfQuestions: 3,
                marksPerQuestion: 2,
            },
        })).rejects.toThrow(/generated 1 questions but 3 were requested/i);
    });
});
//# sourceMappingURL=generation-pipeline.test.js.map