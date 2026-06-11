import type {
  AnswerKeyEntry,
  GeneratedPaper,
  QuestionConfig,
} from "../modules/assignment/assignment.types";
import { MAX_MATERIAL_CHARS } from "./material-parser.service";
import { getAIProvider } from "./ai/providers";
import { parseAIResponse } from "./ai/response-parser";
import { logDebug, logInfo } from "../utils/logger";

export interface AssignmentGenerationInput {
  title: string;
  topic: string;
  instructions: string;
  questionConfig: QuestionConfig;
  materialText?: string;
}

export interface AssignmentGenerationResult {
  generatedPaper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
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
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "answer": "",
      "explanation": "",
      "markingGuide": ""
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

Answer key requirements:
- Provide one answerKey entry for every generated question (${questionConfig.numberOfQuestions} total)
- Number questions globally in section order: Section A Q1 = 1, Section A Q2 = 2, then Section B continues sequentially
- answer: the expected correct response for the question
- explanation: a concise educator-facing explanation of why the answer is correct
- markingGuide: practical marking criteria (what earns full marks, partial credit, common mistakes)

Output rules:
- Return ONLY valid JSON
- Do NOT use markdown or code fences
- Do NOT include any text outside the JSON object`;
}

export async function generateAssignmentPaper(
  input: AssignmentGenerationInput,
): Promise<AssignmentGenerationResult> {
  const materialChars = input.materialText?.trim().length ?? 0;

  const provider = getAIProvider();

  logInfo(`[AI][${provider.name}] Generating assignment paper`, {
    topic: input.topic,
    questions: input.questionConfig.numberOfQuestions,
    materialTextLength: materialChars,
  });

  const prompt = buildAssignmentPrompt(input);
  const rawResponse = await provider.generateAssignment(prompt);
  const structured = parseAIResponse(rawResponse);

  const questionCount = structured.sections.reduce(
    (total, section) => total + section.questions.length,
    0,
  );

  // The parser guarantees answerKey aligns with the generated questions, but
  // not that the model honored the requested count. Reject mismatches so a
  // malformed paper is retried/failed instead of silently persisted.
  const requestedCount = input.questionConfig.numberOfQuestions;
  if (questionCount !== requestedCount) {
    throw new Error(
      `AI response validation failed: generated ${questionCount} questions but ${requestedCount} were requested`,
    );
  }

  logDebug(`[AI][${provider.name}] Structured response validated`, {
    sections: structured.sections.length,
    questions: questionCount,
    answerKeyEntries: structured.answerKey.length,
  });

  return {
    generatedPaper: { sections: structured.sections },
    answerKey: structured.answerKey,
  };
}
