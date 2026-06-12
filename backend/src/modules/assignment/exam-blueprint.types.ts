export const EXAM_PATTERNS = [
  "CUSTOM",
  "UNIVERSITY",
  "CBSE",
  "JEE",
  "NEET",
  "MIDTERM",
  "ENDSEM",
  "QUIZ",
  "ASSIGNMENT",
] as const;

export type ExamPattern = (typeof EXAM_PATTERNS)[number];

export const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD", "MIXED"] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export interface BlueprintSectionDefinition {
  sectionId: string;
  title: string;
  instruction: string;
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface ExamBlueprint {
  examPattern: ExamPattern;
  difficultyLevel: DifficultyLevel;
  sections: BlueprintSectionDefinition[];
  totalQuestions: number;
  totalMarks: number;
}

export interface BuildExamBlueprintInput {
  examPattern: ExamPattern;
  difficultyLevel: DifficultyLevel;
  questionType?: string;
  numberOfQuestions?: number;
  marksPerQuestion?: number;
}
