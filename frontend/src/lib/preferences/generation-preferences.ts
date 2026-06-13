import type { DifficultyLevel, ExamPattern } from "@/lib/constants/exam-blueprint";

export type ExportFormat = "pdf" | "docx";
export type QuestionStyle = "mixed" | "mcq" | "subjective";

export interface GenerationPreferences {
  defaultExamPattern: ExamPattern;
  defaultDifficulty: DifficultyLevel;
  defaultExportFormat: ExportFormat;
  defaultLanguage: string;
  defaultQuestionStyle: QuestionStyle;
}

export const GENERATION_PREFERENCES_KEY = "examforge-generation-preferences";

export const DEFAULT_GENERATION_PREFERENCES: GenerationPreferences = {
  defaultExamPattern: "CUSTOM",
  defaultDifficulty: "MEDIUM",
  defaultExportFormat: "pdf",
  defaultLanguage: "English",
  defaultQuestionStyle: "mixed",
};

export function readGenerationPreferences(): GenerationPreferences {
  if (typeof window === "undefined") return DEFAULT_GENERATION_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(GENERATION_PREFERENCES_KEY);
    if (!raw) return DEFAULT_GENERATION_PREFERENCES;
    return { ...DEFAULT_GENERATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GENERATION_PREFERENCES;
  }
}

export function writeGenerationPreferences(
  preferences: GenerationPreferences,
): void {
  window.localStorage.setItem(
    GENERATION_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
}
