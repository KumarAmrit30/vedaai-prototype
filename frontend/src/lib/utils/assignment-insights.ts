import {
  EXAM_PATTERN_OPTIONS,
  type ExamPattern,
} from "@/lib/constants/exam-blueprint";

export function formatExamPatternLabel(
  pattern: ExamPattern | string | undefined,
): string {
  if (!pattern) return "Custom";
  const match = EXAM_PATTERN_OPTIONS.find((option) => option.value === pattern);
  return match?.label ?? pattern;
}

export function formatDurationMs(durationMs: number | undefined): string | null {
  if (durationMs == null || durationMs <= 0) return null;
  if (durationMs < 1000) return `${durationMs} ms`;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function computeCompressionSavings(
  originalChars: number | undefined,
  summaryChars: number | undefined,
): string | null {
  if (!originalChars || !summaryChars || originalChars <= summaryChars) {
    return null;
  }
  const saved = Math.round(((originalChars - summaryChars) / originalChars) * 100);
  return `${saved}%`;
}

export function estimateMaterialPages(charCount: number | undefined): number | null {
  if (!charCount || charCount <= 0) return null;
  return Math.max(1, Math.ceil(charCount / 3000));
}
