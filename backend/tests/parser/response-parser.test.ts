jest.mock("jsonrepair", () => {
  const actual = jest.requireActual<typeof import("jsonrepair")>("jsonrepair");

  return {
    jsonrepair: jest.fn((text: string) => {
      if (text.includes("__FORCE_REPAIR_FAIL__")) {
        throw new Error("repair failed");
      }

      return actual.jsonrepair(text);
    }),
  };
});

import { parseAIResponse } from "../../src/services/ai/response-parser";

function buildValidPayload(questionCount = 2) {
  const questions = Array.from({ length: questionCount }, (_, index) => ({
    question: `Question ${index + 1}`,
    difficulty: "medium" as const,
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
    const result = parseAIResponse(JSON.stringify(payload));

    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]?.questions).toHaveLength(2);
    expect(result.answerKey).toHaveLength(2);
  });

  it("parses markdown fenced JSON successfully", () => {
    const payload = buildValidPayload(2);
    const fenced = `\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
    const result = parseAIResponse(fenced);

    expect(result.answerKey).toHaveLength(2);
  });

  it("throws on malformed JSON that cannot be repaired", () => {
    expect(() =>
      parseAIResponse("{ not valid json __FORCE_REPAIR_FAIL__"),
    ).toThrow(/Failed to parse AI response as JSON/i);
  });

  it("repairs malformed JSON before Zod validation", () => {
    const payload = buildValidPayload(2);
    const malformed = `${JSON.stringify(payload)},`;

    const result = parseAIResponse(malformed);

    expect(result.sections).toHaveLength(1);
    expect(result.answerKey).toHaveLength(2);
  });

  it("throws when answer key count mismatches question count", () => {
    const payload = buildValidPayload(2);
    payload.answerKey.push({
      questionNumber: 3,
      answer: "Extra",
      explanation: "Extra",
      markingGuide: "Extra",
    });

    expect(() => parseAIResponse(JSON.stringify(payload))).toThrow(
      /AI response validation failed/i,
    );
  });

  it("throws when question entries are missing required schema fields", () => {
    const payload = buildValidPayload(1);
    const question = payload.sections[0]?.questions[0];
    if (!question) {
      throw new Error("Fixture question missing");
    }

    delete (question as { difficulty?: string }).difficulty;

    expect(() => parseAIResponse(JSON.stringify(payload))).toThrow(
      /AI response validation failed/i,
    );
  });

  it("throws when answer key numbering is not sequential", () => {
    const payload = buildValidPayload(2);
    payload.answerKey[1] = {
      questionNumber: 3,
      answer: "Answer 2",
      explanation: "Explanation 2",
      markingGuide: "Guide 2",
    };

    expect(() => parseAIResponse(JSON.stringify(payload))).toThrow(
      /AI response validation failed/i,
    );
  });

  it("throws when required top-level schema fields are missing", () => {
    const payload = {
      answerKey: buildValidPayload(1).answerKey,
    };

    expect(() => parseAIResponse(JSON.stringify(payload))).toThrow(
      /AI response validation failed/i,
    );
  });
});
