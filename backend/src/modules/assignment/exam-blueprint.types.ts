export const EXAM_PATTERNS = [
  "CUSTOM",
  "UNIVERSITY",
  "CBSE",
  "ICSE",
  "JEE",
  "NEET",
  "CUET",
  "SSC",
  "BANKING",
  "CAT",
  "RAILWAYS",
  "MIDTERM",
  "ENDSEM",
  "QUIZ",
  "ASSIGNMENT",
] as const;

export type ExamPattern = (typeof EXAM_PATTERNS)[number];

export const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD", "MIXED"] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/**
 * Answer-key richness modes (Phase 3).
 * - BASIC:    { questionNumber, answer }
 * - STANDARD: { questionNumber, answer, explanation }
 * - DETAILED: { questionNumber, answer, explanation, markingGuide, rubric }
 */
export const ANSWER_KEY_MODES = ["BASIC", "STANDARD", "DETAILED"] as const;

export type AnswerKeyMode = (typeof ANSWER_KEY_MODES)[number];

/** Cognitive demand the questions should target. */
export const REASONING_LEVELS = [
  "recall",
  "application",
  "analysis",
  "evaluation",
] as const;

export type ReasoningLevel = (typeof REASONING_LEVELS)[number];

/** Percentage split of question difficulty across a paper/section. */
export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

/**
 * How questions are distributed across the paper. For subject-based exams
 * (e.g. NEET) each entry is a subject (Physics, Chemistry, Biology). For
 * structure-based academic patterns each entry models a section (Objective,
 * Short Answer, Long Answer). Every entry becomes one blueprint section.
 */
export interface SubjectDistribution {
  subject: string;
  questionCount: number;
  questionType?: string;
  marksPerQuestion?: number;
  instruction?: string;
}

export interface BlueprintSectionDefinition {
  sectionId: string;
  title: string;
  instruction: string;
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
  /** Subject / area label used to steer question generation. */
  subject?: string;
}

export interface ExamBlueprint {
  examPattern: ExamPattern;
  difficultyLevel: DifficultyLevel;
  sections: BlueprintSectionDefinition[];
  totalQuestions: number;
  totalMarks: number;
  /** Driven by the exam template (Phase 1 + Phase 3). */
  answerKeyMode: AnswerKeyMode;
  difficultyDistribution: DifficultyDistribution;
  questionStyle: string[];
  reasoningLevel: ReasoningLevel;
}

export interface BuildExamBlueprintInput {
  examPattern: ExamPattern;
  difficultyLevel: DifficultyLevel;
  questionType?: string;
  numberOfQuestions?: number;
  marksPerQuestion?: number;
}
