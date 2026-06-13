import { buildExamBlueprint, deriveLegacyQuestionConfig } from "../../src/modules/assignment/exam-blueprint.builder";
import {
  computeBlueprintTotalMarks,
  deriveDefaultMarksPerQuestion,
  resolveAssignmentTotalMarks,
} from "../../src/modules/assignment/exam-marks.utils";
import { resolveAssignmentConfig } from "../../src/modules/assignment/exam-blueprint.validation";

type MarksExpectation = {
  pattern: Parameters<typeof buildExamBlueprint>[0]["examPattern"];
  totalQuestions: number;
  totalMarks: number;
  sectionMarks: Array<{ count: number; marks: number }>;
};

const MARKS_EXPECTATIONS: MarksExpectation[] = [
  {
    pattern: "NEET",
    totalQuestions: 180,
    totalMarks: 720,
    sectionMarks: [
      { count: 45, marks: 4 },
      { count: 45, marks: 4 },
      { count: 90, marks: 4 },
    ],
  },
  {
    pattern: "JEE",
    totalQuestions: 75,
    totalMarks: 300,
    sectionMarks: [
      { count: 25, marks: 4 },
      { count: 25, marks: 4 },
      { count: 25, marks: 4 },
    ],
  },
  {
    pattern: "CBSE",
    totalQuestions: 35,
    totalMarks: 65,
    sectionMarks: [
      { count: 20, marks: 1 },
      { count: 10, marks: 2 },
      { count: 5, marks: 5 },
    ],
  },
  {
    pattern: "ICSE",
    totalQuestions: 30,
    totalMarks: 90,
    sectionMarks: [
      { count: 15, marks: 2 },
      { count: 15, marks: 4 },
    ],
  },
  {
    pattern: "UNIVERSITY",
    totalQuestions: 18,
    totalMarks: 90,
    sectionMarks: [
      { count: 10, marks: 2 },
      { count: 5, marks: 5 },
      { count: 3, marks: 15 },
    ],
  },
  {
    pattern: "MIDTERM",
    totalQuestions: 12,
    totalMarks: 40,
    sectionMarks: [
      { count: 5, marks: 1 },
      { count: 5, marks: 3 },
      { count: 2, marks: 10 },
    ],
  },
  {
    pattern: "ENDSEM",
    totalQuestions: 22,
    totalMarks: 102,
    sectionMarks: [
      { count: 10, marks: 1 },
      { count: 8, marks: 4 },
      { count: 4, marks: 15 },
    ],
  },
];

describe("exam marks calculation", () => {
  it.each(MARKS_EXPECTATIONS)(
    "computes section-weighted totals for $pattern",
    ({ pattern, totalQuestions, totalMarks, sectionMarks }) => {
      const blueprint = buildExamBlueprint({
        examPattern: pattern,
        difficultyLevel: "MIXED",
      });

      expect(blueprint.totalQuestions).toBe(totalQuestions);
      expect(blueprint.totalMarks).toBe(totalMarks);
      expect(computeBlueprintTotalMarks(blueprint)).toBe(totalMarks);

      expect(blueprint.sections.map((section) => ({
        count: section.numberOfQuestions,
        marks: section.marksPerQuestion,
      }))).toEqual(sectionMarks);

      // Must NOT equal naive template-default multiplication when sections vary.
      const naiveFromFirstSection =
        totalQuestions * (blueprint.sections[0]?.marksPerQuestion ?? 1);
      if (sectionMarks.some((entry, index) => entry.marks !== sectionMarks[0]?.marks)) {
        expect(blueprint.totalMarks).not.toBe(naiveFromFirstSection);
      }
    },
  );

  it("stores totalMarks on questionConfig via resolveAssignmentConfig", () => {
    const resolved = resolveAssignmentConfig({
      examPattern: "CBSE",
      difficultyLevel: "MIXED",
    });

    expect(resolved.questionConfig.totalMarks).toBe(65);
    expect(resolved.questionConfig.numberOfQuestions).toBe(35);
    expect(resolved.examBlueprint.totalMarks).toBe(65);
  });

  it("deriveLegacyQuestionConfig exposes totalMarks and default marksPerQuestion", () => {
    const cbse = buildExamBlueprint({
      examPattern: "CBSE",
      difficultyLevel: "MIXED",
    });

    expect(deriveLegacyQuestionConfig(cbse)).toEqual({
      questionType: "multiple-choice",
      numberOfQuestions: 35,
      marksPerQuestion: 1,
      totalMarks: 65,
    });

    const university = buildExamBlueprint({
      examPattern: "UNIVERSITY",
      difficultyLevel: "MIXED",
    });

    expect(deriveLegacyQuestionConfig(university)).toEqual({
      questionType: "multiple-choice",
      numberOfQuestions: 18,
      marksPerQuestion: 2,
      totalMarks: 90,
    });

    expect(deriveDefaultMarksPerQuestion(university)).toBe(2);
    expect(university.totalMarks).not.toBe(
      university.totalQuestions * deriveDefaultMarksPerQuestion(university),
    );
  });

  it("resolveAssignmentTotalMarks prefers generated paper marks", () => {
    const total = resolveAssignmentTotalMarks({
      examBlueprint: buildExamBlueprint({
        examPattern: "CBSE",
        difficultyLevel: "MIXED",
      }),
      questionConfig: { numberOfQuestions: 35, marksPerQuestion: 1, totalMarks: 65 },
      generatedPaper: {
        sections: [
          {
            title: "A",
            instruction: "Answer",
            questions: [{ question: "Q1", difficulty: "easy", marks: 2 }],
          },
        ],
      },
    });

    expect(total).toBe(2);
  });
});

describe("deriveLegacyQuestionConfig NEET", () => {
  it("uses uniform marksPerQuestion when all sections match", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "NEET",
      difficultyLevel: "MEDIUM",
    });

    expect(deriveLegacyQuestionConfig(blueprint)).toEqual({
      questionType: "multiple-choice",
      numberOfQuestions: 180,
      marksPerQuestion: 4,
      totalMarks: 720,
    });
  });
});
