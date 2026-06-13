import { buildExamBlueprint } from "../../src/modules/assignment/exam-blueprint.builder";
import {
  isObjectiveQuestionType,
  isMcqQuestionType,
  validateObjectiveQuestionsInResponse,
} from "../../src/services/ai/mcq-validation";
import { validateBatchResponseAgainstBlueprint } from "../../src/services/ai/blueprint-response.validator";

const MCQ_OPTIONS = ["Alpha", "Beta", "Gamma", "Delta"];

function buildValidMcqPayload() {
  return {
    sections: [
      {
        title: "Physics",
        instruction: "Select the best option.",
        questions: [
          {
            question: "Q1",
            difficulty: "medium" as const,
            marks: 4,
            options: MCQ_OPTIONS,
          },
        ],
      },
    ],
    answerKey: [{ questionNumber: 1, answer: "Alpha" }],
  };
}

describe("objective question types", () => {
  it("identifies MCQ and true-false types", () => {
    expect(isMcqQuestionType("multiple-choice")).toBe(true);
    expect(isMcqQuestionType("mcq")).toBe(true);
    expect(isObjectiveQuestionType("true-false")).toBe(true);
    expect(isObjectiveQuestionType("short-answer")).toBe(false);
  });
});

describe("validateObjectiveQuestionsInResponse", () => {
  it("accepts a valid MCQ with four options and matching answer", () => {
    expect(() =>
      validateObjectiveQuestionsInResponse(
        [
          {
            questionType: "multiple-choice",
            questions: buildValidMcqPayload().sections[0]!.questions,
            firstQuestionNumber: 1,
          },
        ],
        buildValidMcqPayload().answerKey,
      ),
    ).not.toThrow();
  });

  it("rejects missing options", () => {
    expect(() =>
      validateObjectiveQuestionsInResponse(
        [
          {
            questionType: "multiple-choice",
            questions: [{ question: "Q12", difficulty: "medium", marks: 4 }],
            firstQuestionNumber: 12,
          },
        ],
        [{ questionNumber: 12, answer: "Alpha" }],
      ),
    ).toThrow("MCQ question 12 is missing options");
  });

  it("rejects fewer than four options", () => {
    expect(() =>
      validateObjectiveQuestionsInResponse(
        [
          {
            questionType: "multiple-choice",
            questions: [
              {
                question: "Q7",
                difficulty: "medium",
                marks: 4,
                options: ["A", "B", "C"],
              },
            ],
            firstQuestionNumber: 7,
          },
        ],
        [{ questionNumber: 7, answer: "A" }],
      ),
    ).toThrow("MCQ question 7 must contain exactly 4 options");
  });

  it("rejects more than four options", () => {
    expect(() =>
      validateObjectiveQuestionsInResponse(
        [
          {
            questionType: "multiple-choice",
            questions: [
              {
                question: "Q5",
                difficulty: "medium",
                marks: 4,
                options: ["A", "B", "C", "D", "E"],
              },
            ],
            firstQuestionNumber: 5,
          },
        ],
        [{ questionNumber: 5, answer: "A" }],
      ),
    ).toThrow("MCQ question 5 must contain exactly 4 options");
  });

  it("rejects duplicate options", () => {
    expect(() =>
      validateObjectiveQuestionsInResponse(
        [
          {
            questionType: "multiple-choice",
            questions: [
              {
                question: "Q7",
                difficulty: "medium",
                marks: 4,
                options: ["Same", "Same", "C", "D"],
              },
            ],
            firstQuestionNumber: 7,
          },
        ],
        [{ questionNumber: 7, answer: "Same" }],
      ),
    ).toThrow("MCQ question 7 contains duplicate options");
  });

  it("rejects answer not present in options", () => {
    expect(() =>
      validateObjectiveQuestionsInResponse(
        [
          {
            questionType: "multiple-choice",
            questions: [
              {
                question: "Q3",
                difficulty: "medium",
                marks: 4,
                options: MCQ_OPTIONS,
              },
            ],
            firstQuestionNumber: 3,
          },
        ],
        [{ questionNumber: 3, answer: "Not an option" }],
      ),
    ).toThrow("MCQ question 3 answer is not present in options");
  });

  it("skips validation for non-objective sections", () => {
    expect(() =>
      validateObjectiveQuestionsInResponse(
        [
          {
            questionType: "short-answer",
            questions: [{ question: "Explain.", difficulty: "medium", marks: 5 }],
            firstQuestionNumber: 1,
          },
        ],
        [{ questionNumber: 1, answer: "Free text" }],
      ),
    ).not.toThrow();
  });
});

describe("validateBatchResponseAgainstBlueprint MCQ integration", () => {
  it("validates NEET batch responses with global question numbers", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "NEET",
      difficultyLevel: "MIXED",
    });
    const physicsSection = blueprint.sections[0]!;

    expect(() =>
      validateBatchResponseAgainstBlueprint(
        {
          sections: [
            {
              title: physicsSection.title,
              instruction: physicsSection.instruction,
              questions: Array.from({ length: 15 }, () => ({
                question: "NEET Q",
                difficulty: "medium" as const,
                marks: 4,
                options: MCQ_OPTIONS,
              })),
            },
          ],
          answerKey: Array.from({ length: 15 }, (_, index) => ({
            questionNumber: 16 + index,
            answer: "Alpha",
          })),
        },
        blueprint,
        0,
        15,
        16,
      ),
    ).not.toThrow();
  });

  it("validates CBSE objective section only in a mixed blueprint batch", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "CBSE",
      difficultyLevel: "MIXED",
    });
    const objectiveSection = blueprint.sections[0]!;

    expect(() =>
      validateBatchResponseAgainstBlueprint(
        {
          sections: [
            {
              title: objectiveSection.title,
              instruction: objectiveSection.instruction,
              questions: Array.from({ length: 5 }, () => ({
                question: "CBSE MCQ",
                difficulty: "easy" as const,
                marks: 1,
                options: MCQ_OPTIONS,
              })),
            },
          ],
          answerKey: Array.from({ length: 5 }, (_, index) => ({
            questionNumber: 1 + index,
            answer: "Alpha",
          })),
        },
        blueprint,
        0,
        5,
        1,
      ),
    ).not.toThrow();
  });
});

describe("blueprint templates require MCQ options", () => {
  const patterns = [
    "NEET",
    "JEE",
    "CUET",
    "SSC",
    "BANKING",
    "CAT",
    "RAILWAYS",
    "QUIZ",
  ] as const;

  it.each(patterns)("marks %s sections as objective MCQ", (examPattern) => {
    const blueprint = buildExamBlueprint({
      examPattern,
      difficultyLevel: "MIXED",
    });

    expect(
      blueprint.sections.every((section) =>
        isMcqQuestionType(section.questionType),
      ),
    ).toBe(true);
  });

  it("marks CBSE first section as objective MCQ only", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "CBSE",
      difficultyLevel: "MIXED",
    });

    expect(isMcqQuestionType(blueprint.sections[0]!.questionType)).toBe(true);
    expect(isMcqQuestionType(blueprint.sections[1]!.questionType)).toBe(false);
  });
});
