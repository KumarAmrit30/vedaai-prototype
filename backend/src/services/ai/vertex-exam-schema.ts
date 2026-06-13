import { SchemaType } from "@google-cloud/vertexai";

/**
 * Vertex responseSchema aligned with Zod assignmentResponseSchema fields.
 */
export const VERTEX_ASSIGNMENT_RESPONSE_SCHEMA = {
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
          explanation: { type: SchemaType.STRING },
          markingGuide: { type: SchemaType.STRING },
        },
        required: [
          "questionNumber",
          "answer",
          "explanation",
          "markingGuide",
        ],
      },
    },
  },
  required: ["sections", "answerKey"],
};
