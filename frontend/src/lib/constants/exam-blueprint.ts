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

export const EXAM_PATTERN_OPTIONS: { value: ExamPattern; label: string }[] = [
  { value: "CUSTOM", label: "Custom" },
  { value: "UNIVERSITY", label: "University Exam" },
  { value: "CBSE", label: "CBSE Board" },
  { value: "JEE", label: "JEE" },
  { value: "NEET", label: "NEET" },
  { value: "MIDTERM", label: "Midterm" },
  { value: "ENDSEM", label: "End Semester" },
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
];

export const DIFFICULTY_LEVEL_OPTIONS: {
  value: DifficultyLevel;
  label: string;
}[] = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
  { value: "MIXED", label: "Mixed" },
];

export const DEFAULT_EXAM_PATTERN: ExamPattern = "CUSTOM";
export const DEFAULT_DIFFICULTY_LEVEL: DifficultyLevel = "MIXED";
