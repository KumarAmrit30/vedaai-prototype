import type {
  BlueprintSectionDefinition,
  DifficultyLevel,
  ExamBlueprint,
  ExamPattern,
} from "../../modules/assignment/exam-blueprint.types";
import type { AssignmentGenerationInput } from "./assignment-generation.types";
import { MAX_MATERIAL_CHARS } from "../material-parser.service";

const EXAM_PATTERN_LABELS: Record<ExamPattern, string> = {
  CUSTOM: "Custom",
  UNIVERSITY: "University Exam",
  CBSE: "CBSE Board",
  JEE: "JEE",
  NEET: "NEET",
  MIDTERM: "Midterm",
  ENDSEM: "End Semester",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
};

const DIFFICULTY_GUIDANCE: Record<DifficultyLevel, string> = {
  EASY: "All questions in this section must use difficulty \"easy\".",
  MEDIUM: "All questions in this section must use difficulty \"medium\".",
  HARD: "All questions in this section must use difficulty \"hard\".",
  MIXED:
    "Include a balanced mix of easy, medium, and hard questions appropriate for this section.",
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  "multiple-choice": "Multiple Choice",
  "short_answer": "Short Answer",
  "short-answer": "Short Answer",
  "long_answer": "Long Answer",
  "long-answer": "Long Answer",
  "true-false": "True / False",
  mixed: "Mixed",
};

export interface BuildPromptSectionContext {
  section: BlueprintSectionDefinition;
  sectionIndex: number;
  totalSections: number;
  globalQuestionOffset: number;
}

function truncateMaterialText(materialText: string): string {
  return materialText.trim().slice(0, MAX_MATERIAL_CHARS);
}

function formatQuestionType(questionType: string): string {
  return QUESTION_TYPE_LABELS[questionType] ?? questionType;
}

function buildMaterialSection(materialText?: string): string {
  const trimmedMaterial = materialText ? truncateMaterialText(materialText) : "";
  if (!trimmedMaterial) return "";

  return `
Use the following study material while generating questions:
"""
${trimmedMaterial}
"""

Material-first rules:
- Base every question on concepts, facts, terminology, and examples present in the study material above.
- Do NOT introduce unrelated topics, chapters, or concepts that are not supported by the source material.
- You may rephrase and assess understanding, but stay faithful to the uploaded content.
`;
}

function buildSharedContext(input: AssignmentGenerationInput): string {
  const { title, topic, instructions, materialText } = input;
  const hasMaterial = Boolean(materialText?.trim());

  return `${buildMaterialSection(materialText)}
Assignment context:
- Title: ${title}
- Topic: ${topic}
- Instructions: ${instructions}
${hasMaterial ? "- When study material is provided, treat it as the authoritative basis for all questions" : "- Questions must match the topic and instructions"}`;
}

function buildLegacyRequirements(questionConfig: AssignmentGenerationInput["questionConfig"]): string {
  return `Requirements:
- Create 1–3 sections with clear titles and instructions
- Total question count must equal ${questionConfig.numberOfQuestions}
- Include a balanced mix of easy, medium, and hard questions where appropriate
- Each question must include difficulty (easy, medium, or hard) and marks (${questionConfig.marksPerQuestion} unless varied slightly for harder items)
- Questions must align with the assignment topic, instructions, and question type`;
}

function buildBlueprintSectionRequirements(
  blueprint: ExamBlueprint,
  context: BuildPromptSectionContext,
): string {
  const { section, sectionIndex, totalSections, globalQuestionOffset } = context;
  const sectionNumber = sectionIndex + 1;
  const firstQuestionNumber = globalQuestionOffset + 1;
  const lastQuestionNumber = globalQuestionOffset + section.numberOfQuestions;

  return `Exam blueprint:
- Exam pattern: ${EXAM_PATTERN_LABELS[blueprint.examPattern]} (${blueprint.examPattern})
- Difficulty level: ${blueprint.difficultyLevel}
- Section ${sectionNumber} of ${totalSections}
- Section title (use exactly): ${section.title}
- Section instruction (use exactly): ${section.instruction}
- Question type for this section: ${formatQuestionType(section.questionType)}
- Questions in this section: ${section.numberOfQuestions}
- Marks per question in this section: ${section.marksPerQuestion}
- Section marks total: ${section.numberOfQuestions * section.marksPerQuestion}

Section requirements:
- Return exactly 1 section in the "sections" array
- The section title and instruction must match the blueprint values exactly
- Generate exactly ${section.numberOfQuestions} questions for this section
- Every question must use ${section.marksPerQuestion} marks
- Every question must follow the "${formatQuestionType(section.questionType)}" format
- ${DIFFICULTY_GUIDANCE[blueprint.difficultyLevel]}
- Questions must align with the assignment topic and instructions

Answer key requirements for this section:
- Provide one answerKey entry for every question in this section (${section.numberOfQuestions} total)
- Number questions ${firstQuestionNumber} through ${lastQuestionNumber} (this section only)
- answer: the expected correct response for the question
- explanation: a concise educator-facing explanation of why the answer is correct
- markingGuide: practical marking criteria (what earns full marks, partial credit, common mistakes)`;
}

export function buildLegacyAssignmentPrompt(input: AssignmentGenerationInput): string {
  const { questionConfig } = input;

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
${buildSharedContext(input)}

Assignment format:
- Question type: ${formatQuestionType(questionConfig.questionType)}
- Total questions: ${questionConfig.numberOfQuestions}
- Marks per question: ${questionConfig.marksPerQuestion}

${buildLegacyRequirements(questionConfig)}

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

export function buildBlueprintSectionPrompt(
  input: AssignmentGenerationInput,
  context: BuildPromptSectionContext,
): string {
  const blueprint = input.examBlueprint;
  if (!blueprint) {
    throw new Error("buildBlueprintSectionPrompt requires examBlueprint on input");
  }

  return `You are an academic assessment generator.

Generate ONE exam section as a single JSON object with this exact structure:
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
${buildSharedContext(input)}

${buildBlueprintSectionRequirements(blueprint, context)}

Output rules:
- Return ONLY valid JSON
- Do NOT use markdown or code fences
- Do NOT include any text outside the JSON object
- Do NOT add extra sections or questions beyond this section specification`;
}

export function buildAssignmentPrompt(
  input: AssignmentGenerationInput,
  sectionContext?: BuildPromptSectionContext,
): string {
  if (input.examBlueprint) {
    if (!sectionContext) {
      throw new Error(
        "buildAssignmentPrompt requires section context when examBlueprint is present",
      );
    }

    return buildBlueprintSectionPrompt(input, sectionContext);
  }

  return buildLegacyAssignmentPrompt(input);
}

export function getExamPatternLabel(examPattern: ExamPattern): string {
  return EXAM_PATTERN_LABELS[examPattern];
}
