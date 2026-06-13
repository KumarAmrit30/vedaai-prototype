import type {
  AnswerKeyEntry,
  AnswerKeyMode,
  Question,
} from "../../modules/assignment/assignment.types";

export interface SolutionPromptContext {
  title: string;
  topic: string;
  instructions: string;
  sectionTitle: string;
  subject?: string;
  answerKeyMode: AnswerKeyMode;
  questions: Question[];
  /** Answer-key slice for this section, aligned to `questions` by order. */
  answerKey: AnswerKeyEntry[];
  /** Global number of the first question in this section. */
  firstQuestionNumber: number;
}

function formatQuestionLine(
  question: Question,
  answer: AnswerKeyEntry,
  questionNumber: number,
): string {
  const optionsText =
    question.options && question.options.length > 0
      ? `\n   Options: ${question.options
          .map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`)
          .join("  ")}`
      : "";

  return `${questionNumber}. ${question.question}${optionsText}\n   Correct answer: ${answer.answer}`;
}

function buildJsonHint(mode: AnswerKeyMode): string {
  if (mode === "DETAILED") {
    return `{
  "solutions": [
    {
      "questionNumber": 1,
      "explanation": "",
      "markingGuide": "",
      "rubric": ""
    }
  ]
}`;
  }

  return `{
  "solutions": [
    {
      "questionNumber": 1,
      "explanation": ""
    }
  ]
}`;
}

function buildFieldRequirements(mode: AnswerKeyMode): string {
  const lines = [
    "- explanation: a concise educator-facing explanation of why the correct answer is correct",
  ];

  if (mode === "DETAILED") {
    lines.push(
      "- markingGuide: practical marking criteria (what earns full marks, partial credit, common mistakes)",
      "- rubric: a short criteria-based scoring breakdown for evaluators",
    );
  }

  return lines.join("\n");
}

export function buildSolutionsSectionPrompt(
  context: SolutionPromptContext,
): string {
  const lastQuestionNumber =
    context.firstQuestionNumber + context.questions.length - 1;

  const questionLines = context.questions
    .map((question, index) => {
      const answer = context.answerKey[index];
      if (!answer) {
        return `${context.firstQuestionNumber + index}. ${question.question}`;
      }
      return formatQuestionLine(
        question,
        answer,
        context.firstQuestionNumber + index,
      );
    })
    .join("\n\n");

  return `You are an exam solutions author. Write solutions for the questions below.

Return ONLY a single JSON object with this exact structure:
${buildJsonHint(context.answerKeyMode)}

Context:
- Title: ${context.title}
- Topic: ${context.topic}
- Instructions: ${context.instructions}
- Section: ${context.sectionTitle}${
    context.subject ? `\n- Subject / area: ${context.subject}` : ""
  }

Questions and their correct answers:
${questionLines}

Requirements:
- Provide exactly one solution entry per question (${context.questions.length} total)
- Number solutions ${context.firstQuestionNumber} through ${lastQuestionNumber}
${buildFieldRequirements(context.answerKeyMode)}

Output rules:
- Return ONLY valid JSON
- Do NOT use markdown or code fences
- Do NOT include any text outside the JSON object`;
}
