import type { GeneratedPaper, QuestionConfig } from "../modules/assignment/assignment.types";
import { MAX_MATERIAL_CHARS } from "./material-parser.service";
import { generateContent } from "./ai/gemini.service";
import { parseAIResponse } from "./ai/response-parser";
import { logDebug, logInfo } from "../utils/logger";

export interface AssignmentGenerationInput {
  title: string;
  topic: string;
  instructions: string;
  questionConfig: QuestionConfig;
  materialText?: string;
}

function truncateMaterialText(materialText: string): string {
  return materialText.trim().slice(0, MAX_MATERIAL_CHARS);
}

function buildAssignmentPrompt(input: AssignmentGenerationInput): string {
  const { title, topic, instructions, questionConfig, materialText } = input;
  const trimmedMaterial = materialText ? truncateMaterialText(materialText) : "";
  const hasMaterial = Boolean(trimmedMaterial);

  const materialSection = hasMaterial
    ? `
Use the following study material while generating questions:
"""
${trimmedMaterial}
"""

Material-first rules:
- Base every question on concepts, facts, terminology, and examples present in the study material above.
- Do NOT introduce unrelated topics, chapters, or concepts that are not supported by the source material.
- You may rephrase and assess understanding, but stay faithful to the uploaded content.
`
    : "";

  return `You are an academic assessment generator.

Generate a test assignment as a single JSON object with this exact structure:
{
  "sections": [
    {
      "title": "",
      "instruction": "",
      "questions": [
        {
          "question": "",
          "difficulty": "easy | medium | hard",
          "marks": 2
        }
      ]
    }
  ]
}
${materialSection}
Assignment context:
- Title: ${title}
- Topic: ${topic}
- Instructions: ${instructions}
- Question type: ${questionConfig.questionType}
- Total questions: ${questionConfig.numberOfQuestions}
- Marks per question: ${questionConfig.marksPerQuestion}

Requirements:
- Create 1–3 sections with clear titles and instructions
- Total question count must equal ${questionConfig.numberOfQuestions}
- Include a balanced mix of easy, medium, and hard questions where appropriate
- Each question must include difficulty (easy, medium, or hard) and marks (${questionConfig.marksPerQuestion} unless varied slightly for harder items)
- Questions must align with the assignment topic, instructions, and question type
${hasMaterial ? "- When study material is provided, treat it as the authoritative basis for all questions" : "- Questions must match the topic and instructions"}

Output rules:
- Return ONLY valid JSON
- Do NOT use markdown or code fences
- Do NOT include explanations or any text outside the JSON object`;
}

export async function generateAssignmentPaper(
  input: AssignmentGenerationInput,
): Promise<GeneratedPaper> {
  const materialChars = input.materialText?.trim().length ?? 0;

  logInfo("[AI] Generating assignment paper", {
    topic: input.topic,
    questions: input.questionConfig.numberOfQuestions,
    materialTextLength: materialChars,
  });

  const prompt = buildAssignmentPrompt(input);
  const rawResponse = await generateContent(prompt);
  const structured = parseAIResponse(rawResponse);

  logDebug("[AI] Structured response validated", {
    sections: structured.sections.length,
    questions: structured.sections.reduce(
      (total, section) => total + section.questions.length,
      0,
    ),
  });

  return structured;
}
