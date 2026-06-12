import type {
  BlueprintSectionDefinition,
  BuildExamBlueprintInput,
  ExamBlueprint,
  ExamPattern,
} from "./exam-blueprint.types";

type SectionTemplate = Omit<BlueprintSectionDefinition, "sectionId">;

const PATTERN_SECTION_TEMPLATES: Record<
  Exclude<ExamPattern, "CUSTOM">,
  SectionTemplate[]
> = {
  QUIZ: [
    {
      title: "Section A — Quick Quiz",
      instruction: "Choose the best answer for each question.",
      questionType: "multiple-choice",
      numberOfQuestions: 10,
      marksPerQuestion: 1,
    },
  ],
  ASSIGNMENT: [
    {
      title: "Section A — Written Responses",
      instruction: "Answer each question in detail with supporting reasoning.",
      questionType: "long-answer",
      numberOfQuestions: 5,
      marksPerQuestion: 10,
    },
  ],
  MIDTERM: [
    {
      title: "Section A — Multiple Choice",
      instruction: "Select the correct option for each question.",
      questionType: "multiple-choice",
      numberOfQuestions: 5,
      marksPerQuestion: 1,
    },
    {
      title: "Section B — Short Answer",
      instruction: "Answer concisely in 2–3 sentences.",
      questionType: "short-answer",
      numberOfQuestions: 5,
      marksPerQuestion: 3,
    },
    {
      title: "Section C — Long Answer",
      instruction: "Answer with detailed explanations.",
      questionType: "long-answer",
      numberOfQuestions: 2,
      marksPerQuestion: 10,
    },
  ],
  ENDSEM: [
    {
      title: "Section A — Multiple Choice",
      instruction: "Select the correct option for each question.",
      questionType: "multiple-choice",
      numberOfQuestions: 10,
      marksPerQuestion: 1,
    },
    {
      title: "Section B — Short Answer",
      instruction: "Answer concisely with key points.",
      questionType: "short-answer",
      numberOfQuestions: 8,
      marksPerQuestion: 4,
    },
    {
      title: "Section C — Long Answer",
      instruction: "Answer comprehensively with examples where applicable.",
      questionType: "long-answer",
      numberOfQuestions: 4,
      marksPerQuestion: 15,
    },
  ],
  CBSE: [
    {
      title: "Section A — Objective Type",
      instruction: "Choose the correct answer.",
      questionType: "multiple-choice",
      numberOfQuestions: 20,
      marksPerQuestion: 1,
    },
    {
      title: "Section B — Very Short Answer",
      instruction: "Answer in one or two sentences.",
      questionType: "short-answer",
      numberOfQuestions: 10,
      marksPerQuestion: 2,
    },
    {
      title: "Section C — Long Answer",
      instruction: "Answer with detailed explanations.",
      questionType: "long-answer",
      numberOfQuestions: 5,
      marksPerQuestion: 5,
    },
  ],
  JEE: [
    {
      title: "Section 1 — Multiple Choice",
      instruction: "Select the single best answer. Each question has one correct option.",
      questionType: "multiple-choice",
      numberOfQuestions: 20,
      marksPerQuestion: 4,
    },
    {
      title: "Section 2 — Numerical Value",
      instruction: "Enter the numerical answer. No options are provided.",
      questionType: "short-answer",
      numberOfQuestions: 5,
      marksPerQuestion: 4,
    },
  ],
  NEET: [
    {
      title: "Section A — Multiple Choice",
      instruction: "Select the correct option for each question.",
      questionType: "multiple-choice",
      numberOfQuestions: 45,
      marksPerQuestion: 4,
    },
  ],
  UNIVERSITY: [
    {
      title: "Section A — Multiple Choice",
      instruction: "Select the correct option for each question.",
      questionType: "multiple-choice",
      numberOfQuestions: 10,
      marksPerQuestion: 2,
    },
    {
      title: "Section B — Short Answer",
      instruction: "Answer briefly with supporting points.",
      questionType: "short-answer",
      numberOfQuestions: 5,
      marksPerQuestion: 5,
    },
    {
      title: "Section C — Long Answer",
      instruction: "Answer with detailed analysis and examples.",
      questionType: "long-answer",
      numberOfQuestions: 3,
      marksPerQuestion: 15,
    },
  ],
};

function withSectionIds(templates: SectionTemplate[]): BlueprintSectionDefinition[] {
  return templates.map((section, index) => ({
    ...section,
    sectionId: `section-${index + 1}`,
  }));
}

function buildCustomSections(input: BuildExamBlueprintInput): BlueprintSectionDefinition[] {
  return [
    {
      sectionId: "section-1",
      title: "Section A",
      instruction: "Answer all questions.",
      questionType: input.questionType!,
      numberOfQuestions: input.numberOfQuestions!,
      marksPerQuestion: input.marksPerQuestion!,
    },
  ];
}

function computeTotals(sections: BlueprintSectionDefinition[]): {
  totalQuestions: number;
  totalMarks: number;
} {
  return sections.reduce(
    (acc, section) => ({
      totalQuestions: acc.totalQuestions + section.numberOfQuestions,
      totalMarks:
        acc.totalMarks + section.numberOfQuestions * section.marksPerQuestion,
    }),
    { totalQuestions: 0, totalMarks: 0 },
  );
}

export function buildExamBlueprint(input: BuildExamBlueprintInput): ExamBlueprint {
  const sections =
    input.examPattern === "CUSTOM"
      ? buildCustomSections(input)
      : withSectionIds(PATTERN_SECTION_TEMPLATES[input.examPattern]);

  const { totalQuestions, totalMarks } = computeTotals(sections);

  return {
    examPattern: input.examPattern,
    difficultyLevel: input.difficultyLevel,
    sections,
    totalQuestions,
    totalMarks,
  };
}

export function deriveLegacyQuestionConfig(
  blueprint: ExamBlueprint,
  fallback?: {
    questionType?: string;
    numberOfQuestions?: number;
    marksPerQuestion?: number;
  },
): {
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
} {
  if (blueprint.examPattern === "CUSTOM" && fallback) {
    return {
      questionType: fallback.questionType!,
      numberOfQuestions: fallback.numberOfQuestions!,
      marksPerQuestion: fallback.marksPerQuestion!,
    };
  }

  const primarySection = blueprint.sections[0];

  return {
    questionType: primarySection?.questionType ?? fallback?.questionType ?? "mixed",
    numberOfQuestions: blueprint.totalQuestions,
    marksPerQuestion:
      primarySection?.marksPerQuestion ?? fallback?.marksPerQuestion ?? 1,
  };
}
