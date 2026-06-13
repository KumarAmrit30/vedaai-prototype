import type { ExamBlueprint } from "../../modules/assignment/exam-blueprint.types";
import type { QuestionSection } from "../../modules/assignment/assignment.types";
import {
  firstQuestionNumberForBlueprintSection,
  validateObjectiveQuestionsInResponse,
} from "./mcq-validation";
import type { AssignmentResponse, Section } from "./response-parser";

function formatSectionLabel(sectionIndex: number): string {
  return `Section ${sectionIndex + 1}`;
}

function validateSectionStructure(
  section: Section,
  blueprintSection: ExamBlueprint["sections"][number],
  sectionIndex: number,
): void {
  const label = formatSectionLabel(sectionIndex);

  if (section.title.trim() !== blueprintSection.title.trim()) {
    throw new Error(
      `AI response validation failed: ${label} title must be "${blueprintSection.title}"`,
    );
  }

  if (section.instruction.trim() !== blueprintSection.instruction.trim()) {
    throw new Error(
      `AI response validation failed: ${label} instruction must match the blueprint`,
    );
  }

  if (section.questions.length !== blueprintSection.numberOfQuestions) {
    throw new Error(
      `AI response validation failed: ${label} expected ${blueprintSection.numberOfQuestions} questions but generated ${section.questions.length}`,
    );
  }

  for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex += 1) {
    const question = section.questions[questionIndex];
    if (!question) continue;

    if (question.marks !== blueprintSection.marksPerQuestion) {
      throw new Error(
        `AI response validation failed: ${label} question ${questionIndex + 1} must use ${blueprintSection.marksPerQuestion} marks`,
      );
    }
  }
}

export function validateBatchResponseAgainstBlueprint(
  response: AssignmentResponse,
  blueprint: ExamBlueprint,
  sectionIndex: number,
  expectedQuestionCount: number,
  batchFirstQuestionNumber?: number,
): void {
  const blueprintSection = blueprint.sections[sectionIndex];
  if (!blueprintSection) {
    throw new Error(
      `AI response validation failed: blueprint section ${sectionIndex + 1} is missing`,
    );
  }

  if (response.sections.length !== 1) {
    throw new Error(
      `AI response validation failed: expected 1 section for ${formatSectionLabel(sectionIndex)} batch but generated ${response.sections.length}`,
    );
  }

  const section = response.sections[0];
  if (!section) {
    throw new Error(
      `AI response validation failed: ${formatSectionLabel(sectionIndex)} batch is empty`,
    );
  }

  if (section.title.trim() !== blueprintSection.title.trim()) {
    throw new Error(
      `AI response validation failed: ${formatSectionLabel(sectionIndex)} batch title must be "${blueprintSection.title}"`,
    );
  }

  if (section.instruction.trim() !== blueprintSection.instruction.trim()) {
    throw new Error(
      `AI response validation failed: ${formatSectionLabel(sectionIndex)} batch instruction must match the blueprint`,
    );
  }

  if (section.questions.length !== expectedQuestionCount) {
    throw new Error(
      `AI response validation failed: ${formatSectionLabel(sectionIndex)} batch expected ${expectedQuestionCount} questions but generated ${section.questions.length}`,
    );
  }

  for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex += 1) {
    const question = section.questions[questionIndex];
    if (!question) continue;

    if (question.marks !== blueprintSection.marksPerQuestion) {
      throw new Error(
        `AI response validation failed: ${formatSectionLabel(sectionIndex)} batch question ${questionIndex + 1} must use ${blueprintSection.marksPerQuestion} marks`,
      );
    }
  }

  if (response.answerKey.length !== expectedQuestionCount) {
    throw new Error(
      `AI response validation failed: ${formatSectionLabel(sectionIndex)} batch answerKey must contain ${expectedQuestionCount} entries`,
    );
  }

  validateObjectiveQuestionsInResponse(
    [
      {
        questionType: blueprintSection.questionType,
        questions: section.questions,
        firstQuestionNumber:
          batchFirstQuestionNumber ??
          firstQuestionNumberForBlueprintSection(
            blueprint.sections,
            sectionIndex,
          ),
      },
    ],
    response.answerKey,
  );
}

export function validateSectionResponseAgainstBlueprint(
  response: AssignmentResponse,
  blueprint: ExamBlueprint,
  sectionIndex: number,
): void {
  const blueprintSection = blueprint.sections[sectionIndex];
  if (!blueprintSection) {
    throw new Error(
      `AI response validation failed: blueprint section ${sectionIndex + 1} is missing`,
    );
  }

  if (response.sections.length !== 1) {
    throw new Error(
      `AI response validation failed: expected 1 section for ${formatSectionLabel(sectionIndex)} but generated ${response.sections.length}`,
    );
  }

  const section = response.sections[0];
  if (!section) {
    throw new Error(
      `AI response validation failed: ${formatSectionLabel(sectionIndex)} is empty`,
    );
  }

  validateSectionStructure(section, blueprintSection, sectionIndex);

  if (response.answerKey.length !== blueprintSection.numberOfQuestions) {
    throw new Error(
      `AI response validation failed: ${formatSectionLabel(sectionIndex)} answerKey must contain ${blueprintSection.numberOfQuestions} entries`,
    );
  }

  validateObjectiveQuestionsInResponse(
    [
      {
        questionType: blueprintSection.questionType,
        questions: section.questions,
        firstQuestionNumber: firstQuestionNumberForBlueprintSection(
          blueprint.sections,
          sectionIndex,
        ),
      },
    ],
    response.answerKey,
  );
}

export function validateMergedPaperAgainstBlueprint(
  sections: Section[],
  blueprint: ExamBlueprint,
): void {
  if (sections.length !== blueprint.sections.length) {
    throw new Error(
      `AI response validation failed: expected ${blueprint.sections.length} sections but generated ${sections.length}`,
    );
  }

  for (let sectionIndex = 0; sectionIndex < blueprint.sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    const blueprintSection = blueprint.sections[sectionIndex];

    if (!section || !blueprintSection) {
      throw new Error(
        `AI response validation failed: ${formatSectionLabel(sectionIndex)} is missing from generated paper`,
      );
    }

    validateSectionStructure(section, blueprintSection, sectionIndex);
  }

  const totalQuestions = sections.reduce(
    (total, section) => total + section.questions.length,
    0,
  );

  if (totalQuestions !== blueprint.totalQuestions) {
    throw new Error(
      `AI response validation failed: generated ${totalQuestions} questions but ${blueprint.totalQuestions} were requested`,
    );
  }
}

export function normalizeSectionFromBlueprint(
  section: Section,
  blueprintSection: ExamBlueprint["sections"][number],
): QuestionSection {
  return {
    title: blueprintSection.title,
    instruction: blueprintSection.instruction,
    questions: section.questions,
    ...(blueprintSection.subject ? { subject: blueprintSection.subject } : {}),
  };
}
