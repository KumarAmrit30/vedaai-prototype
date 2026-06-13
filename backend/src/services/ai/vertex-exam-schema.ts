import { SchemaType } from "@google-cloud/vertexai";

/**
 * Vertex responseSchema for paper generation (Phase 4 — deferred solutions).
 * Questions may include MCQ options; the answer key carries only the question
 * number and correct answer. Explanations / marking guides / rubrics are NOT
 * requested here — they are generated on demand to minimize token usage.
 */
export const VERTEX_GENERATION_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          instruction: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                question: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING },
                marks: { type: SchemaType.NUMBER },
                options: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
              },
              required: ["question", "difficulty", "marks"],
            },
          },
        },
        required: ["title", "instruction", "questions"],
      },
    },
    answerKey: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionNumber: { type: SchemaType.NUMBER },
          answer: { type: SchemaType.STRING },
        },
        required: ["questionNumber", "answer"],
      },
    },
  },
  required: ["sections", "answerKey"],
};

/** Backward-compatible alias used by existing call sites. */
export const VERTEX_ASSIGNMENT_RESPONSE_SCHEMA =
  VERTEX_GENERATION_RESPONSE_SCHEMA;

/**
 * Vertex responseSchema for on-demand solution generation (Phase 4). Marking
 * guide and rubric are optional and only requested for DETAILED mode.
 */
export const VERTEX_SOLUTIONS_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    solutions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionNumber: { type: SchemaType.NUMBER },
          explanation: { type: SchemaType.STRING },
          markingGuide: { type: SchemaType.STRING },
          rubric: { type: SchemaType.STRING },
        },
        required: ["questionNumber", "explanation"],
      },
    },
  },
  required: ["solutions"],
};
