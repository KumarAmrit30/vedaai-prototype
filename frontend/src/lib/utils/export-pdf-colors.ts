/** Hex-only palette for PDF export — safe for html2canvas (no CSS variables or modern color functions). */
export const PDF_COLORS = {
  white: "#ffffff",
  text: "#111111",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  border: "#d1d5db",
  borderStrong: "#374151",
  answerLine: "#d1d5db",
  keyBackground: "#f9fafb",
  separator: "#d1d5db",
} as const;

export const PDF_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const PDF_EXPORT_WIDTH_PX = 794;
