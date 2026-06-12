import {
  buildExamBlueprint,
  deriveLegacyQuestionConfig,
} from "../../src/modules/assignment/exam-blueprint.builder";
import {
  questionConfigSchema,
  resolveAssignmentConfig,
} from "../../src/modules/assignment/exam-blueprint.validation";

describe("buildExamBlueprint", () => {
  it("builds a single section for CUSTOM pattern from legacy question config", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "CUSTOM",
      difficultyLevel: "MEDIUM",
      questionType: "short-answer",
      numberOfQuestions: 6,
      marksPerQuestion: 5,
    });

    expect(blueprint.examPattern).toBe("CUSTOM");
    expect(blueprint.difficultyLevel).toBe("MEDIUM");
    expect(blueprint.sections).toHaveLength(1);
    expect(blueprint.sections[0]).toMatchObject({
      sectionId: "section-1",
      questionType: "short-answer",
      numberOfQuestions: 6,
      marksPerQuestion: 5,
    });
    expect(blueprint.totalQuestions).toBe(6);
    expect(blueprint.totalMarks).toBe(30);
  });

  it("builds predefined sections for JEE pattern", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "JEE",
      difficultyLevel: "HARD",
    });

    expect(blueprint.sections).toHaveLength(2);
    expect(blueprint.totalQuestions).toBe(25);
    expect(blueprint.totalMarks).toBe(100);
  });

  it("builds predefined sections for QUIZ pattern", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "QUIZ",
      difficultyLevel: "EASY",
    });

    expect(blueprint.sections).toHaveLength(1);
    expect(blueprint.totalQuestions).toBe(10);
    expect(blueprint.totalMarks).toBe(10);
  });
});

describe("deriveLegacyQuestionConfig", () => {
  it("returns user config for CUSTOM pattern", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "CUSTOM",
      difficultyLevel: "MIXED",
      questionType: "long-answer",
      numberOfQuestions: 4,
      marksPerQuestion: 10,
    });

    expect(
      deriveLegacyQuestionConfig(blueprint, {
        questionType: "long-answer",
        numberOfQuestions: 4,
        marksPerQuestion: 10,
      }),
    ).toEqual({
      questionType: "long-answer",
      numberOfQuestions: 4,
      marksPerQuestion: 10,
    });
  });

  it("derives totals from blueprint for non-CUSTOM patterns", () => {
    const blueprint = buildExamBlueprint({
      examPattern: "NEET",
      difficultyLevel: "MEDIUM",
    });

    expect(deriveLegacyQuestionConfig(blueprint)).toEqual({
      questionType: "multiple-choice",
      numberOfQuestions: 45,
      marksPerQuestion: 4,
    });
  });
});

describe("questionConfigSchema", () => {
  it("accepts legacy-only question config (backward compatible)", () => {
    const result = questionConfigSchema.safeParse({
      questionType: "short-answer",
      numberOfQuestions: 6,
      marksPerQuestion: 5,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.examPattern).toBe("CUSTOM");
      expect(result.data.difficultyLevel).toBe("MIXED");
    }
  });

  it("requires legacy fields when examPattern is CUSTOM", () => {
    const result = questionConfigSchema.safeParse({
      examPattern: "CUSTOM",
      difficultyLevel: "EASY",
    });

    expect(result.success).toBe(false);
  });

  it("accepts preset pattern without legacy question counts", () => {
    const result = questionConfigSchema.safeParse({
      examPattern: "JEE",
      difficultyLevel: "HARD",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid examPattern values", () => {
    const result = questionConfigSchema.safeParse({
      examPattern: "INVALID",
      questionType: "short-answer",
      numberOfQuestions: 5,
      marksPerQuestion: 2,
    });

    expect(result.success).toBe(false);
  });
});

describe("resolveAssignmentConfig", () => {
  it("returns both questionConfig and examBlueprint", () => {
    const resolved = resolveAssignmentConfig({
      examPattern: "MIDTERM",
      difficultyLevel: "MIXED",
    });

    expect(resolved.examBlueprint.examPattern).toBe("MIDTERM");
    expect(resolved.examBlueprint.sections.length).toBeGreaterThan(1);
    expect(resolved.questionConfig.examPattern).toBe("MIDTERM");
    expect(resolved.questionConfig.numberOfQuestions).toBe(
      resolved.examBlueprint.totalQuestions,
    );
  });
});
