import type {
  BlueprintSectionDefinition,
  DifficultyDistribution,
  DifficultyLevel,
  ExamBlueprint,
  ExamPattern,
} from "../../modules/assignment/exam-blueprint.types";
import { getExamPromptGuidance } from "../../modules/assignment/exam-template";
import type { AssignmentGenerationInput } from "./assignment-generation.types";

/** Aggressive cap for legacy raw-material fallback (compressed path is preferred). */
const MATERIAL_FALLBACK_CHARS = 6000;

const DIFFICULTY_GUIDANCE: Record<DifficultyLevel, string> = {
  EASY: 'All questions in this section must use difficulty "easy".',
  MEDIUM: 'All questions in this section must use difficulty "medium".',
  HARD: 'All questions in this section must use difficulty "hard".',
  MIXED:
    "Include a mix of easy, medium, and hard questions according to the difficulty distribution below.",
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  "multiple-choice": "Multiple Choice",
  short_answer: "Short Answer",
  "short-answer": "Short Answer",
  long_answer: "Long Answer",
  "long-answer": "Long Answer",
  "true-false": "True / False",
  mixed: "Mixed",
};

const OBJECTIVE_QUESTION_TYPES = new Set([
  "mcq",
  "multiple-choice",
  "true-false",
]);

export interface BuildPromptSectionContext {
  section: BlueprintSectionDefinition;
  sectionIndex: number;
  totalSections: number;
  globalQuestionOffset: number;
}

function formatQuestionType(questionType: string): string {
  return QUESTION_TYPE_LABELS[questionType] ?? questionType;
}

function isObjectiveType(questionType: string): boolean {
  return OBJECTIVE_QUESTION_TYPES.has(questionType);
}

function difficultyCounts(
  total: number,
  distribution: DifficultyDistribution,
): { easy: number; medium: number; hard: number } {
  const easy = Math.round((total * distribution.easy) / 100);
  const hard = Math.round((total * distribution.hard) / 100);
  const medium = Math.max(0, total - easy - hard);
  return { easy, medium, hard };
}

/**
 * Material section (Phase 5): prefer the compressed summary + syllabus
 * concepts. Falls back to a heavily truncated slice of raw material only for
 * legacy assignments that predate compression.
 */
function buildMaterialSection(input: AssignmentGenerationInput): string {
  const summary = input.materialSummary?.trim();
  const concepts = input.syllabusConcepts ?? [];

  if (summary || concepts.length > 0) {
    const conceptLine =
      concepts.length > 0
        ? `\nKey syllabus concepts: ${concepts.join(", ")}.`
        : "";
    const summaryBlock = summary
      ? `\nTopic summary of the source material:\n"""\n${summary}\n"""`
      : "";

    return `Use this compressed representation of the uploaded study material:${summaryBlock}${conceptLine}

Material-first rules:
- Base every question on the summarized concepts and listed syllabus concepts above.
- Do NOT introduce topics or concepts unsupported by this material.
`;
  }

  const raw = input.materialText?.trim();
  if (!raw) return "";

  return `Use the following study material while generating questions:
"""
${raw.slice(0, MATERIAL_FALLBACK_CHARS)}
"""

Material-first rules:
- Base every question on concepts, facts, and examples present in the material above.
- Do NOT introduce unrelated topics or concepts not supported by the source material.
`;
}

function buildSharedContext(input: AssignmentGenerationInput): string {
  const { title, topic, instructions } = input;
  const hasMaterial = Boolean(
    input.materialSummary?.trim() ||
      (input.syllabusConcepts?.length ?? 0) > 0 ||
      input.materialText?.trim(),
  );

  return `${buildMaterialSection(input)}
Assignment context:
- Title: ${title}
- Topic: ${topic}
- Instructions: ${instructions}
${
  hasMaterial
    ? "- Treat the provided material summary and concepts as the authoritative basis for all questions"
    : "- Questions must match the topic and instructions"
}`;
}

/** Exam-specific instruction block (Phase 6). */
function buildExamGuidance(examPattern: ExamPattern): string {
  const guidance = getExamPromptGuidance(examPattern);
  const styleLines = guidance.questionStyle
    .map((style) => `- ${style}`)
    .join("\n");
  const avoidLines =
    guidance.avoid.length > 0
      ? `\nAvoid:\n${guidance.avoid.map((item) => `- ${item}`).join("\n")}`
      : "";

  return `Exam style (${guidance.label}):
${guidance.examInstructions}
- Target cognitive level: ${guidance.reasoningLevel}
Preferred question style:
${styleLines}${avoidLines}`;
}

function buildObjectiveJsonHint(includeOptions: boolean): string {
  const optionsLine = includeOptions
    ? '\n          "options": ["", "", "", ""],'
    : "";

  return `{
  "sections": [
    {
      "title": "",
      "instruction": "",
      "questions": [
        {
          "question": "",${optionsLine}
          "difficulty": "easy | medium | hard",
          "marks": 2
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "answer": ""
    }
  ]
}`;
}

function buildDeferredAnswerKeyRules(
  firstQuestionNumber: number,
  lastQuestionNumber: number,
  includeOptions: boolean,
): string {
  const answerRule = includeOptions
    ? "- answer: the exact text of the single correct option"
    : "- answer: the expected correct response for the question";

  return `Answer key requirements:
- Provide exactly one answerKey entry per question
- Number questions ${firstQuestionNumber} through ${lastQuestionNumber}
${answerRule}
- Do NOT include explanations, marking guides, or rubrics — these are generated separately on demand`;
}

function buildBlueprintSectionRequirements(
  blueprint: ExamBlueprint,
  context: BuildPromptSectionContext,
): string {
  const { section, sectionIndex, totalSections, globalQuestionOffset } = context;
  const sectionNumber = sectionIndex + 1;
  const firstQuestionNumber = globalQuestionOffset + 1;
  const lastQuestionNumber = globalQuestionOffset + section.numberOfQuestions;
  const includeOptions = isObjectiveType(section.questionType);

  const distribution = blueprint.difficultyDistribution ?? {
    easy: 30,
    medium: 50,
    hard: 20,
  };
  const counts = difficultyCounts(section.numberOfQuestions, distribution);
  const difficultyLine =
    blueprint.difficultyLevel === "MIXED"
      ? `- Difficulty distribution for this section: ~${counts.easy} easy, ~${counts.medium} medium, ~${counts.hard} hard`
      : `- ${DIFFICULTY_GUIDANCE[blueprint.difficultyLevel]}`;

  const optionsRule = includeOptions
    ? section.questionType === "true-false"
      ? '\n- Every question must include the options ["True", "False"] with one correct answer'
      : "\n- Every question must include exactly 4 plausible options with one correct answer"
    : "";

  return `Exam blueprint:
- Section ${sectionNumber} of ${totalSections}${
    section.subject ? `\n- Subject / area: ${section.subject}` : ""
  }
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
- Every question must follow the "${formatQuestionType(section.questionType)}" format${optionsRule}
${difficultyLine}
- Questions must align with the assignment topic and instructions

${buildDeferredAnswerKeyRules(firstQuestionNumber, lastQuestionNumber, includeOptions)}`;
}

export function buildLegacyAssignmentPrompt(
  input: AssignmentGenerationInput,
): string {
  const { questionConfig } = input;
  const includeOptions = isObjectiveType(questionConfig.questionType);

  return `You are an academic assessment generator.

Generate a test assignment as a single JSON object with this exact structure:
${buildObjectiveJsonHint(includeOptions)}
${buildSharedContext(input)}

Assignment format:
- Question type: ${formatQuestionType(questionConfig.questionType)}
- Total questions: ${questionConfig.numberOfQuestions}
- Marks per question: ${questionConfig.marksPerQuestion}

Requirements:
- Create 1–3 sections with clear titles and instructions
- Total question count must equal ${questionConfig.numberOfQuestions}
- Include a balanced mix of easy, medium, and hard questions where appropriate
- Each question must include difficulty (easy, medium, or hard) and marks${
    includeOptions
      ? questionConfig.questionType === "true-false"
        ? '\n- Each question must include the options ["True", "False"]'
        : "\n- Each question must include exactly 4 options"
      : ""
  }

${buildDeferredAnswerKeyRules(1, questionConfig.numberOfQuestions, includeOptions)}

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

  const includeOptions = isObjectiveType(context.section.questionType);

  return `You are an academic assessment generator.

Generate ONE exam section as a single JSON object with this exact structure:
${buildObjectiveJsonHint(includeOptions)}
${buildSharedContext(input)}

${buildExamGuidance(blueprint.examPattern)}

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

export { getExamPatternLabel } from "../../modules/assignment/exam-template";
