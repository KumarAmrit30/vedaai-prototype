import type {
  AnswerKeyMode,
  DifficultyDistribution,
  DifficultyLevel,
  ExamPattern,
  ReasoningLevel,
  SubjectDistribution,
} from "./exam-blueprint.types";

/**
 * An ExamTemplate is the single source of truth for how an exam paper is
 * shaped. Templates drive blueprint construction, answer-key richness, prompt
 * style, and difficulty mix (Phases 1, 2, 3, 6).
 */
export interface ExamTemplate {
  pattern: ExamPattern;
  label: string;
  totalQuestions: number;
  marksPerQuestion: number;
  subjectDistribution: SubjectDistribution[];
  difficultyDistribution: DifficultyDistribution;
  answerKeyMode: AnswerKeyMode;
  questionStyle: string[];
  reasoningLevel: ReasoningLevel;
  /** Default question type when a subject entry does not override it. */
  defaultQuestionType: string;
  /** Exam-specific guidance injected into generation prompts (Phase 6). */
  examInstructions: string;
  /** Phrasings the model must avoid (e.g. NEET: no recall/definition items). */
  avoid?: string[];
}

const NEET_TEMPLATE: ExamTemplate = {
  pattern: "NEET",
  label: "NEET (NTA)",
  totalQuestions: 180,
  marksPerQuestion: 4,
  defaultQuestionType: "multiple-choice",
  answerKeyMode: "BASIC",
  reasoningLevel: "application",
  difficultyDistribution: { easy: 20, medium: 55, hard: 25 },
  subjectDistribution: [
    { subject: "Physics", questionCount: 45 },
    { subject: "Chemistry", questionCount: 45 },
    { subject: "Biology", questionCount: 90 },
  ],
  questionStyle: [
    "Application-based reasoning",
    "NTA-style distractors (plausible, concept-targeted options)",
    "Concept integration across topics",
    "Numerical reasoning where applicable",
  ],
  examInstructions:
    "Use NTA-style competitive single-best-answer MCQs. Favor application, " +
    "reasoning, and concept integration over factual recall. Craft four " +
    "options where the distractors target common misconceptions. Include " +
    "numerical-reasoning items where the subject allows.",
  avoid: [
    "Definition-based recall questions",
    "Single-line theory questions",
    "Questions answerable by memorizing a single fact",
  ],
};

const JEE_TEMPLATE: ExamTemplate = {
  pattern: "JEE",
  label: "JEE Main (NTA)",
  totalQuestions: 75,
  marksPerQuestion: 4,
  defaultQuestionType: "multiple-choice",
  answerKeyMode: "BASIC",
  reasoningLevel: "analysis",
  difficultyDistribution: { easy: 25, medium: 50, hard: 25 },
  subjectDistribution: [
    { subject: "Physics", questionCount: 25 },
    { subject: "Chemistry", questionCount: 25 },
    { subject: "Mathematics", questionCount: 25 },
  ],
  questionStyle: [
    "Numerical and multi-concept problems",
    "Multi-step quantitative reasoning",
    "Application of formulae across topics",
  ],
  examInstructions:
    "Favor numerical-value and multi-concept questions that require " +
    "multi-step quantitative reasoning. Prefer problems combining more than " +
    "one concept over single-formula recall.",
  avoid: ["Pure definition recall", "Single-line theory questions"],
};

const CBSE_TEMPLATE: ExamTemplate = {
  pattern: "CBSE",
  label: "CBSE Board",
  totalQuestions: 35,
  marksPerQuestion: 1,
  defaultQuestionType: "mixed",
  answerKeyMode: "STANDARD",
  reasoningLevel: "application",
  difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
  subjectDistribution: [
    {
      subject: "Objective Type",
      questionCount: 20,
      questionType: "multiple-choice",
      marksPerQuestion: 1,
      instruction: "Choose the correct answer.",
    },
    {
      subject: "Short Answer",
      questionCount: 10,
      questionType: "short-answer",
      marksPerQuestion: 2,
      instruction: "Answer in one or two sentences.",
    },
    {
      subject: "Long Answer",
      questionCount: 5,
      questionType: "long-answer",
      marksPerQuestion: 5,
      instruction: "Answer with detailed explanations.",
    },
  ],
  questionStyle: [
    "Board-exam phrasing aligned with NCERT",
    "Competency-based and case-study style items",
  ],
  examInstructions:
    "Follow the CBSE board-exam structure and marking style. Use clear, " +
    "NCERT-aligned phrasing and competency-based items.",
};

const ICSE_TEMPLATE: ExamTemplate = {
  pattern: "ICSE",
  label: "ICSE Board",
  totalQuestions: 30,
  marksPerQuestion: 2,
  defaultQuestionType: "mixed",
  answerKeyMode: "STANDARD",
  reasoningLevel: "application",
  difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
  subjectDistribution: [
    {
      subject: "Section A — Compulsory Short Answer",
      questionCount: 15,
      questionType: "short-answer",
      marksPerQuestion: 2,
      instruction: "Answer all questions briefly.",
    },
    {
      subject: "Section B — Structured Long Answer",
      questionCount: 15,
      questionType: "long-answer",
      marksPerQuestion: 4,
      instruction: "Answer with detailed, structured explanations.",
    },
  ],
  questionStyle: [
    "Detailed, application-oriented phrasing",
    "Structured multi-part questions",
  ],
  examInstructions:
    "Follow the ICSE board-exam structure with detailed, application-oriented " +
    "questions and structured multi-part items.",
};

const UNIVERSITY_TEMPLATE: ExamTemplate = {
  pattern: "UNIVERSITY",
  label: "University Exam",
  totalQuestions: 18,
  marksPerQuestion: 5,
  defaultQuestionType: "mixed",
  answerKeyMode: "DETAILED",
  reasoningLevel: "evaluation",
  difficultyDistribution: { easy: 20, medium: 50, hard: 30 },
  subjectDistribution: [
    {
      subject: "Section A — Multiple Choice",
      questionCount: 10,
      questionType: "multiple-choice",
      marksPerQuestion: 2,
      instruction: "Select the correct option for each question.",
    },
    {
      subject: "Section B — Short Answer",
      questionCount: 5,
      questionType: "short-answer",
      marksPerQuestion: 5,
      instruction: "Answer briefly with supporting points.",
    },
    {
      subject: "Section C — Long Answer",
      questionCount: 3,
      questionType: "long-answer",
      marksPerQuestion: 15,
      instruction: "Answer with detailed analysis and examples.",
    },
  ],
  questionStyle: [
    "Analytical and evaluative prompts",
    "Higher-order critical thinking",
  ],
  examInstructions:
    "Generate university-level questions that demand analysis and evaluation, " +
    "with detailed rubric-ready long-answer items.",
};

const CUET_TEMPLATE: ExamTemplate = {
  pattern: "CUET",
  label: "CUET (UG)",
  totalQuestions: 50,
  marksPerQuestion: 5,
  defaultQuestionType: "multiple-choice",
  answerKeyMode: "BASIC",
  reasoningLevel: "application",
  difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
  subjectDistribution: [{ subject: "Domain Subject", questionCount: 50 }],
  questionStyle: [
    "NCERT-aligned competitive MCQs",
    "Application and comprehension based items",
  ],
  examInstructions:
    "Use CUET-style domain MCQs aligned to NCERT, mixing comprehension and " +
    "application items with single best answers.",
  avoid: ["Out-of-syllabus questions"],
};

const SSC_TEMPLATE: ExamTemplate = {
  pattern: "SSC",
  label: "SSC (CGL Tier-1)",
  totalQuestions: 100,
  marksPerQuestion: 2,
  defaultQuestionType: "multiple-choice",
  answerKeyMode: "BASIC",
  reasoningLevel: "application",
  difficultyDistribution: { easy: 35, medium: 45, hard: 20 },
  subjectDistribution: [
    { subject: "General Intelligence & Reasoning", questionCount: 25 },
    { subject: "General Awareness", questionCount: 25 },
    { subject: "Quantitative Aptitude", questionCount: 25 },
    { subject: "English Comprehension", questionCount: 25 },
  ],
  questionStyle: [
    "Speed-oriented competitive MCQs",
    "Reasoning, quantitative, and language items",
  ],
  examInstructions:
    "Use SSC-style competitive MCQs across reasoning, awareness, quantitative " +
    "aptitude, and English with single best answers.",
};

const BANKING_TEMPLATE: ExamTemplate = {
  pattern: "BANKING",
  label: "Banking (IBPS PO Prelims)",
  totalQuestions: 100,
  marksPerQuestion: 1,
  defaultQuestionType: "multiple-choice",
  answerKeyMode: "BASIC",
  reasoningLevel: "application",
  difficultyDistribution: { easy: 35, medium: 45, hard: 20 },
  subjectDistribution: [
    { subject: "English Language", questionCount: 30 },
    { subject: "Quantitative Aptitude", questionCount: 35 },
    { subject: "Reasoning Ability", questionCount: 35 },
  ],
  questionStyle: [
    "Bank-exam style competitive MCQs",
    "Data interpretation and reasoning sets",
  ],
  examInstructions:
    "Use banking-exam style MCQs with quantitative aptitude, reasoning, and " +
    "English items; include data-interpretation style questions.",
};

const CAT_TEMPLATE: ExamTemplate = {
  pattern: "CAT",
  label: "CAT (MBA)",
  totalQuestions: 66,
  marksPerQuestion: 3,
  defaultQuestionType: "multiple-choice",
  answerKeyMode: "BASIC",
  reasoningLevel: "analysis",
  difficultyDistribution: { easy: 20, medium: 50, hard: 30 },
  subjectDistribution: [
    { subject: "Verbal Ability & Reading Comprehension", questionCount: 24 },
    { subject: "Data Interpretation & Logical Reasoning", questionCount: 20 },
    { subject: "Quantitative Ability", questionCount: 22 },
  ],
  questionStyle: [
    "High-difficulty analytical MCQs",
    "Reasoning-heavy, multi-step items",
  ],
  examInstructions:
    "Use CAT-style high-difficulty analytical questions emphasizing logical " +
    "reasoning, data interpretation, and quantitative ability.",
};

const RAILWAYS_TEMPLATE: ExamTemplate = {
  pattern: "RAILWAYS",
  label: "Railways (RRB NTPC)",
  totalQuestions: 100,
  marksPerQuestion: 1,
  defaultQuestionType: "multiple-choice",
  answerKeyMode: "BASIC",
  reasoningLevel: "application",
  difficultyDistribution: { easy: 40, medium: 45, hard: 15 },
  subjectDistribution: [
    { subject: "Mathematics", questionCount: 30 },
    { subject: "General Intelligence & Reasoning", questionCount: 30 },
    { subject: "General Awareness", questionCount: 40 },
  ],
  questionStyle: [
    "RRB-style competitive MCQs",
    "Awareness, reasoning, and arithmetic items",
  ],
  examInstructions:
    "Use RRB NTPC-style competitive MCQs across mathematics, reasoning, and " +
    "general awareness with single best answers.",
};

const QUIZ_TEMPLATE: ExamTemplate = {
  pattern: "QUIZ",
  label: "Quiz",
  totalQuestions: 10,
  marksPerQuestion: 1,
  defaultQuestionType: "multiple-choice",
  answerKeyMode: "STANDARD",
  reasoningLevel: "recall",
  difficultyDistribution: { easy: 50, medium: 40, hard: 10 },
  subjectDistribution: [
    {
      subject: "Section A — Quick Quiz",
      questionCount: 10,
      questionType: "multiple-choice",
      marksPerQuestion: 1,
      instruction: "Choose the best answer for each question.",
    },
  ],
  questionStyle: ["Short, focused recall and comprehension items"],
  examInstructions:
    "Generate a short quiz with focused single-best-answer questions.",
};

const ASSIGNMENT_TEMPLATE: ExamTemplate = {
  pattern: "ASSIGNMENT",
  label: "Assignment",
  totalQuestions: 5,
  marksPerQuestion: 10,
  defaultQuestionType: "long-answer",
  answerKeyMode: "DETAILED",
  reasoningLevel: "analysis",
  difficultyDistribution: { easy: 20, medium: 50, hard: 30 },
  subjectDistribution: [
    {
      subject: "Section A — Written Responses",
      questionCount: 5,
      questionType: "long-answer",
      marksPerQuestion: 10,
      instruction: "Answer each question in detail with supporting reasoning.",
    },
  ],
  questionStyle: ["Open-ended analytical writing prompts"],
  examInstructions:
    "Generate open-ended written-response questions requiring detailed " +
    "reasoning suitable for graded assignments.",
};

const MIDTERM_TEMPLATE: ExamTemplate = {
  pattern: "MIDTERM",
  label: "Midterm",
  totalQuestions: 12,
  marksPerQuestion: 1,
  defaultQuestionType: "mixed",
  answerKeyMode: "STANDARD",
  reasoningLevel: "application",
  difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
  subjectDistribution: [
    {
      subject: "Section A — Multiple Choice",
      questionCount: 5,
      questionType: "multiple-choice",
      marksPerQuestion: 1,
      instruction: "Select the correct option for each question.",
    },
    {
      subject: "Section B — Short Answer",
      questionCount: 5,
      questionType: "short-answer",
      marksPerQuestion: 3,
      instruction: "Answer concisely in 2–3 sentences.",
    },
    {
      subject: "Section C — Long Answer",
      questionCount: 2,
      questionType: "long-answer",
      marksPerQuestion: 10,
      instruction: "Answer with detailed explanations.",
    },
  ],
  questionStyle: ["Balanced mid-semester coverage"],
  examInstructions: "Generate a balanced midterm covering core concepts.",
};

const ENDSEM_TEMPLATE: ExamTemplate = {
  pattern: "ENDSEM",
  label: "End Semester",
  totalQuestions: 22,
  marksPerQuestion: 1,
  defaultQuestionType: "mixed",
  answerKeyMode: "DETAILED",
  reasoningLevel: "analysis",
  difficultyDistribution: { easy: 25, medium: 50, hard: 25 },
  subjectDistribution: [
    {
      subject: "Section A — Multiple Choice",
      questionCount: 10,
      questionType: "multiple-choice",
      marksPerQuestion: 1,
      instruction: "Select the correct option for each question.",
    },
    {
      subject: "Section B — Short Answer",
      questionCount: 8,
      questionType: "short-answer",
      marksPerQuestion: 4,
      instruction: "Answer concisely with key points.",
    },
    {
      subject: "Section C — Long Answer",
      questionCount: 4,
      questionType: "long-answer",
      marksPerQuestion: 15,
      instruction: "Answer comprehensively with examples where applicable.",
    },
  ],
  questionStyle: ["Comprehensive end-of-term coverage"],
  examInstructions:
    "Generate a comprehensive end-semester paper covering the full syllabus.",
};

/** Static templates for all preset patterns. CUSTOM is built per request. */
const PRESET_TEMPLATES: Record<Exclude<ExamPattern, "CUSTOM">, ExamTemplate> = {
  NEET: NEET_TEMPLATE,
  JEE: JEE_TEMPLATE,
  CBSE: CBSE_TEMPLATE,
  ICSE: ICSE_TEMPLATE,
  UNIVERSITY: UNIVERSITY_TEMPLATE,
  CUET: CUET_TEMPLATE,
  SSC: SSC_TEMPLATE,
  BANKING: BANKING_TEMPLATE,
  CAT: CAT_TEMPLATE,
  RAILWAYS: RAILWAYS_TEMPLATE,
  QUIZ: QUIZ_TEMPLATE,
  ASSIGNMENT: ASSIGNMENT_TEMPLATE,
  MIDTERM: MIDTERM_TEMPLATE,
  ENDSEM: ENDSEM_TEMPLATE,
};

export interface CustomTemplateInput {
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
  difficultyLevel: DifficultyLevel;
}

const DIFFICULTY_LEVEL_DISTRIBUTIONS: Record<
  DifficultyLevel,
  DifficultyDistribution | null
> = {
  EASY: { easy: 100, medium: 0, hard: 0 },
  MEDIUM: { easy: 0, medium: 100, hard: 0 },
  HARD: { easy: 0, medium: 0, hard: 100 },
  MIXED: null,
};

/** Default mix used for CUSTOM papers when difficultyLevel is MIXED. */
const DEFAULT_MIXED_DISTRIBUTION: DifficultyDistribution = {
  easy: 30,
  medium: 50,
  hard: 20,
};

function buildCustomTemplate(input: CustomTemplateInput): ExamTemplate {
  return {
    pattern: "CUSTOM",
    label: "Custom",
    totalQuestions: input.numberOfQuestions,
    marksPerQuestion: input.marksPerQuestion,
    defaultQuestionType: input.questionType,
    answerKeyMode: "STANDARD",
    reasoningLevel: "application",
    difficultyDistribution:
      DIFFICULTY_LEVEL_DISTRIBUTIONS[input.difficultyLevel] ??
      DEFAULT_MIXED_DISTRIBUTION,
    subjectDistribution: [
      {
        subject: "Section A",
        questionCount: input.numberOfQuestions,
        questionType: input.questionType,
        marksPerQuestion: input.marksPerQuestion,
        instruction: "Answer all questions.",
      },
    ],
    questionStyle: ["Aligned to the provided topic and instructions"],
    examInstructions:
      "Generate questions strictly aligned to the assignment topic, " +
      "instructions, and selected question type.",
  };
}

export function getExamTemplate(
  pattern: ExamPattern,
  customInput?: CustomTemplateInput,
): ExamTemplate {
  if (pattern === "CUSTOM") {
    if (!customInput) {
      throw new Error("CUSTOM exam template requires custom question config");
    }
    return buildCustomTemplate(customInput);
  }

  return PRESET_TEMPLATES[pattern];
}

/**
 * Resolves the difficulty distribution for a paper. A specific difficulty
 * level (EASY/MEDIUM/HARD) forces a uniform distribution; MIXED uses the
 * template's default mix.
 */
export function resolveDifficultyDistribution(
  template: ExamTemplate,
  difficultyLevel: DifficultyLevel,
): DifficultyDistribution {
  return (
    DIFFICULTY_LEVEL_DISTRIBUTIONS[difficultyLevel] ??
    template.difficultyDistribution
  );
}

export interface ExamPromptGuidance {
  label: string;
  examInstructions: string;
  avoid: string[];
  questionStyle: string[];
  reasoningLevel: ReasoningLevel;
}

/**
 * Prompt guidance resolvable without a custom config (works for CUSTOM too),
 * used by the prompt builder for exam-specific instructions (Phase 6).
 */
export function getExamPromptGuidance(
  pattern: ExamPattern,
): ExamPromptGuidance {
  if (pattern === "CUSTOM") {
    return {
      label: "Custom",
      examInstructions:
        "Generate questions strictly aligned to the assignment topic, " +
        "instructions, and selected question type.",
      avoid: [],
      questionStyle: ["Aligned to the provided topic and instructions"],
      reasoningLevel: "application",
    };
  }

  const template = PRESET_TEMPLATES[pattern];
  return {
    label: template.label,
    examInstructions: template.examInstructions,
    avoid: template.avoid ?? [],
    questionStyle: template.questionStyle,
    reasoningLevel: template.reasoningLevel,
  };
}

export function getExamPatternLabel(pattern: ExamPattern): string {
  return getExamPromptGuidance(pattern).label;
}

/**
 * Resolves the answer-key mode for an exam pattern (Phase 3 mapping):
 * NEET/JEE/CUET/SSC/Banking -> BASIC, CBSE/ICSE -> STANDARD, University ->
 * DETAILED. Defaults to STANDARD for unmapped patterns.
 */
export function resolveAnswerKeyMode(
  pattern: ExamPattern,
  customInput?: CustomTemplateInput,
): AnswerKeyMode {
  return getExamTemplate(pattern, customInput).answerKeyMode;
}

export { PRESET_TEMPLATES };
