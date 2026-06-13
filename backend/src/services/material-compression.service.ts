/**
 * Material compression (Phase 5).
 *
 * Instead of injecting the entire uploaded PDF/TXT into every generation
 * prompt, we build a compact representation once: a topic summary plus a list
 * of syllabus concepts. This is a deterministic, extractive process (no AI
 * call) so it adds zero token cost while reducing prompt size by >=70%.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "else", "for", "of",
  "to", "in", "on", "at", "by", "with", "as", "is", "are", "was", "were",
  "be", "been", "being", "this", "that", "these", "those", "it", "its", "we",
  "you", "they", "he", "she", "his", "her", "their", "our", "your", "i",
  "from", "into", "than", "such", "can", "will", "would", "should", "could",
  "may", "might", "must", "shall", "do", "does", "did", "has", "have", "had",
  "not", "no", "so", "up", "out", "about", "over", "under", "between", "also",
  "which", "who", "whom", "whose", "what", "when", "where", "why", "how",
  "all", "any", "each", "more", "most", "other", "some", "only", "very",
  "there", "here", "because", "while", "during", "both", "either", "neither",
]);

/** Compressed summary budget — capped to guarantee a large reduction. */
const MAX_SUMMARY_CHARS = 2500;
/** Fraction of the original text the summary is allowed to occupy. */
const SUMMARY_BUDGET_RATIO = 0.25;
const MAX_CONCEPTS = 25;
const MAX_SUMMARY_SENTENCES = 18;

export interface CompressedMaterial {
  summary: string;
  concepts: string[];
  originalChars: number;
  compressedChars: number;
  /** Fraction by which the representation shrank vs the raw material (0..1). */
  reductionRatio: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function buildWordFrequencies(text: string): Map<string, number> {
  const frequencies = new Map<string, number>();
  for (const word of tokenize(text)) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }
  return frequencies;
}

function scoreSentence(
  sentence: string,
  frequencies: Map<string, number>,
): number {
  const words = tokenize(sentence);
  if (words.length === 0) return 0;
  const total = words.reduce(
    (sum, word) => sum + (frequencies.get(word) ?? 0),
    0,
  );
  // Normalize by length so long sentences are not unfairly favored.
  return total / Math.sqrt(words.length);
}

function extractConcepts(
  text: string,
  frequencies: Map<string, number>,
): string[] {
  const concepts = new Map<string, number>();

  // Capitalized multi-word phrases (proper nouns, named concepts).
  const phraseMatches =
    text.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})\b/g) ?? [];
  for (const phrase of phraseMatches) {
    const normalized = phrase.trim();
    if (normalized.length < 4) continue;
    if (STOPWORDS.has(normalized.toLowerCase())) continue;
    concepts.set(normalized, (concepts.get(normalized) ?? 0) + 3);
  }

  // High-frequency single terms.
  const topTerms = [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CONCEPTS);
  for (const [term, count] of topTerms) {
    if (count < 2) continue;
    if (![...concepts.keys()].some((c) => c.toLowerCase().includes(term))) {
      concepts.set(term, (concepts.get(term) ?? 0) + count);
    }
  }

  return [...concepts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CONCEPTS)
    .map(([concept]) => concept);
}

function buildSummary(
  sentences: string[],
  frequencies: Map<string, number>,
  budget: number,
): string {
  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreSentence(sentence, frequencies),
    }))
    .sort((a, b) => b.score - a.score);

  const selected: { sentence: string; index: number }[] = [];
  let used = 0;

  for (const candidate of ranked) {
    if (selected.length >= MAX_SUMMARY_SENTENCES) break;
    if (used + candidate.sentence.length > budget && selected.length > 0) {
      continue;
    }
    selected.push(candidate);
    used += candidate.sentence.length + 1;
    if (used >= budget) break;
  }

  return selected
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence)
    .join(" ")
    .slice(0, budget);
}

export function compressMaterial(rawText: string): CompressedMaterial {
  const text = rawText.trim();
  const originalChars = text.length;

  if (originalChars === 0) {
    return {
      summary: "",
      concepts: [],
      originalChars: 0,
      compressedChars: 0,
      reductionRatio: 0,
    };
  }

  const frequencies = buildWordFrequencies(text);
  const sentences = splitSentences(text);
  const budget = Math.min(
    MAX_SUMMARY_CHARS,
    Math.max(280, Math.floor(originalChars * SUMMARY_BUDGET_RATIO)),
  );

  const summary = buildSummary(sentences, frequencies, budget);
  const concepts = extractConcepts(text, frequencies);

  const compressedChars = summary.length + concepts.join(", ").length;
  const reductionRatio =
    originalChars > 0
      ? Math.max(0, 1 - compressedChars / originalChars)
      : 0;

  return {
    summary,
    concepts,
    originalChars,
    compressedChars,
    reductionRatio,
  };
}
