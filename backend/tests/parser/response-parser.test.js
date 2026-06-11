"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_parser_1 = require("../../src/services/ai/response-parser");
function buildValidPayload(questionCount = 2) {
    const questions = Array.from({ length: questionCount }, (_, index) => ({
        question: `Question ${index + 1}`,
        difficulty: "medium",
        marks: 2,
    }));
    const answerKey = Array.from({ length: questionCount }, (_, index) => ({
        questionNumber: index + 1,
        answer: `Answer ${index + 1}`,
        explanation: `Explanation ${index + 1}`,
        markingGuide: `Guide ${index + 1}`,
    }));
    return {
        sections: [
            {
                title: "Section A",
                instruction: "Answer all questions.",
                questions,
            },
        ],
        answerKey,
    };
}
describe("parseAIResponse", () => {
    it("parses valid JSON successfully", () => {
        const payload = buildValidPayload(2);
        const result = (0, response_parser_1.parseAIResponse)(JSON.stringify(payload));
        expect(result.sections).toHaveLength(1);
        expect(result.sections[0]?.questions).toHaveLength(2);
        expect(result.answerKey).toHaveLength(2);
    });
    it("parses markdown fenced JSON successfully", () => {
        const payload = buildValidPayload(2);
        const fenced = `\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
        const result = (0, response_parser_1.parseAIResponse)(fenced);
        expect(result.answerKey).toHaveLength(2);
    });
    it("throws on malformed JSON", () => {
        expect(() => (0, response_parser_1.parseAIResponse)("{ not valid json")).toThrow(/Failed to parse AI response as JSON/i);
    });
    it("throws when answer key count mismatches question count", () => {
        const payload = buildValidPayload(2);
        payload.answerKey.push({
            questionNumber: 3,
            answer: "Extra",
            explanation: "Extra",
            markingGuide: "Extra",
        });
        expect(() => (0, response_parser_1.parseAIResponse)(JSON.stringify(payload))).toThrow(/AI response validation failed/i);
    });
    it("throws when question entries are missing required schema fields", () => {
        const payload = buildValidPayload(1);
        const question = payload.sections[0]?.questions[0];
        if (!question) {
            throw new Error("Fixture question missing");
        }
        delete question.difficulty;
        expect(() => (0, response_parser_1.parseAIResponse)(JSON.stringify(payload))).toThrow(/AI response validation failed/i);
    });
    it("throws when answer key numbering is not sequential", () => {
        const payload = buildValidPayload(2);
        payload.answerKey[1] = {
            questionNumber: 3,
            answer: "Answer 2",
            explanation: "Explanation 2",
            markingGuide: "Guide 2",
        };
        expect(() => (0, response_parser_1.parseAIResponse)(JSON.stringify(payload))).toThrow(/AI response validation failed/i);
    });
    it("throws when required top-level schema fields are missing", () => {
        const payload = {
            answerKey: buildValidPayload(1).answerKey,
        };
        expect(() => (0, response_parser_1.parseAIResponse)(JSON.stringify(payload))).toThrow(/AI response validation failed/i);
    });
});
//# sourceMappingURL=response-parser.test.js.map