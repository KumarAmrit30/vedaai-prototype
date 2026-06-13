import type {
  BlueprintSectionDefinition,
  DifficultyLevel,
  ExamBlueprint,
  ExamPattern,
} from "../../modules/assignment/exam-blueprint.types";
import { getExamPromptGuidance } from "../../modules/assignment/exam-template";
import type { DifficultyCounts } from "./generation-batch";
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

/** Optional batch slice when a large section is split for generation. */
export interface BuildPromptBatchContext extends BuildPromptSectionContext {
  batchIndex: number;
  batchCount: number;
  batchQuestionCount: number;
  batchDifficultyCounts: DifficultyCounts;
  /** Global question number offset for the first question in this batch. */
  batchGlobalQuestionOffset: number;
}

function formatQuestionType(questionType: string): string {
  return QUESTION_TYPE_LABELS[questionType] ?? questionType;
}

function isObjectiveType(questionType: string): boolean {
  return OBJECTIVE_QUESTION_TYPES.has(questionType);
}

function buildDifficultyRequirement(
  blueprint: ExamBlueprint,
  questionCount: number,
  batchDifficultyCounts?: DifficultyCounts,
): string {
  if (blueprint.difficultyLevel !== "MIXED") {
    return `- ${DIFFICULTY_GUIDANCE[blueprint.difficultyLevel]}`;
  }

  if (batchDifficultyCounts) {
    return (
      `- Difficulty distribution for this batch (exact counts — do not approximate): ` +
      `${batchDifficultyCounts.easy} easy, ${batchDifficultyCounts.medium} medium, ${batchDifficultyCounts.hard} hard`
    );
  }

  return `- Include a mix of easy, medium, and hard questions (${questionCount} total)`;
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
  batch?: Pick<
    BuildPromptBatchContext,
    | "batchIndex"
    | "batchCount"
    | "batchQuestionCount"
    | "batchDifficultyCounts"
    | "batchGlobalQuestionOffset"
  >,
): string {
  const { section, sectionIndex, totalSections } = context;
  const sectionNumber = sectionIndex + 1;
  const questionCount = batch?.batchQuestionCount ?? section.numberOfQuestions;
  const batchOffset =
    batch?.batchGlobalQuestionOffset ?? context.globalQuestionOffset;
  const firstQuestionNumber = batchOffset + 1;
  const lastQuestionNumber = batchOffset + questionCount;
  const includeOptions = isObjectiveType(section.questionType);

  const difficultyLine = buildDifficultyRequirement(
    blueprint,
    questionCount,
    batch?.batchDifficultyCounts,
  );

  const batchLine =
    batch && batch.batchCount > 1
      ? `- Internal generation batch ${batch.batchIndex + 1} of ${batch.batchCount} for this section\n`
      : "";

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
${batchLine}- Questions to generate in this response: ${questionCount}
- Marks per question: ${section.marksPerQuestion}

Section requirements:
- Return exactly 1 section in the "sections" array
- The section title and instruction must match the blueprint values exactly
- Generate exactly ${questionCount} questions in this response
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
  batch?: BuildPromptBatchContext,
): string {
  const blueprint = input.examBlueprint;
  if (!blueprint) {
    throw new Error("buildBlueprintSectionPrompt requires examBlueprint on input");
  }

  const includeOptions = isObjectiveType(context.section.questionType);
  const batchRequirements = batch
    ? {
        batchIndex: batch.batchIndex,
        batchCount: batch.batchCount,
        batchQuestionCount: batch.batchQuestionCount,
        batchDifficultyCounts: batch.batchDifficultyCounts,
        batchGlobalQuestionOffset: batch.batchGlobalQuestionOffset,
      }
    : undefined;

  return `You are an academic assessment generator.

Generate ONE exam section as a single JSON object with this exact structure:
${buildObjectiveJsonHint(includeOptions)}
${buildSharedContext(input)}

${buildExamGuidance(blueprint.examPattern)}

${buildBlueprintSectionRequirements(blueprint, context, batchRequirements)}

Output rules:
- Return ONLY valid JSON
- Do NOT use markdown or code fences
- Do NOT include any text outside the JSON object
- Do NOT add extra sections or questions beyond this response specification`;
}

export function buildAssignmentPrompt(
  input: AssignmentGenerationInput,
  sectionContext?: BuildPromptSectionContext,
  batchContext?: BuildPromptBatchContext,
): string {
  if (input.examBlueprint) {
    if (!sectionContext) {
      throw new Error(
        "buildAssignmentPrompt requires section context when examBlueprint is present",
      );
    }

    return buildBlueprintSectionPrompt(input, sectionContext, batchContext);
  }

  return buildLegacyAssignmentPrompt(input);
}

export { getExamPatternLabel } from "../../modules/assignment/exam-template";
