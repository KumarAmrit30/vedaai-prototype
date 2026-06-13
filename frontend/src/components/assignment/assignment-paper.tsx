"use client";

import type { Assignment } from "@/types/assignment";
import { formatAssignmentDate } from "@/lib/utils/format-assignment";
import { getAssignmentTotalMarks } from "@/lib/utils/assignment-marks";
import {
  answerLineCountForQuestionType,
  formatOptionLabel,
  hasDisplayableOptions,
  resolveSectionQuestionType,
} from "@/lib/utils/question-display";

interface AssignmentPaperProps {
  assignment: Assignment;
  variant?: "preview" | "print";
}

export function AssignmentPaper({
  assignment,
  variant = "preview",
}: AssignmentPaperProps) {
  const { generatedPaper, questionConfig } = assignment;
  const totalMarks = getAssignmentTotalMarks(assignment);

  const paperClassName =
    variant === "print" ? "assignment-print-paper" : "preview-a4-paper";
  const innerClassName =
    variant === "print"
      ? "assignment-print-paper__inner"
      : "preview-a4-paper__inner";

  return (
    <article
      id={variant === "preview" ? "assignment-preview" : undefined}
      className={paperClassName}
      data-assignment-paper
    >
      <div className={innerClassName}>
        <header className="preview-exam-header">
          <h1 className="preview-exam-header__school">ExamForge AI</h1>
          <h2 className="preview-exam-header__title">{assignment.title}</h2>
          <div className="preview-exam-header__meta">
            <span className="preview-exam-header__meta-item">
              Subject: {assignment.topic}
            </span>
            <span className="preview-exam-header__meta-item">
              Due: {formatAssignmentDate(assignment.dueDate, "long")}
            </span>
            <span className="preview-exam-header__meta-item">
              Questions: {questionConfig.numberOfQuestions}
            </span>
            <span className="preview-exam-header__meta-item">
              Marks: {totalMarks}
            </span>
          </div>
        </header>

        {assignment.instructions ? (
          <section className="preview-exam-instructions">
            <span className="preview-exam-instructions__label">
              General Instructions
            </span>
            {assignment.instructions}
          </section>
        ) : null}

        {generatedPaper?.sections?.length ? (
          <>
            {generatedPaper.sections.map((section, sectionIndex) => {
              const sectionQuestionType = resolveSectionQuestionType(
                assignment,
                sectionIndex,
              );

              return (
                <section
                  key={`${section.title}-${sectionIndex}`}
                  className="preview-exam-section"
                >
                  <h3 className="preview-exam-section__heading">
                    Section {String.fromCharCode(65 + sectionIndex)}
                  </h3>
                  <p className="preview-exam-section__subtitle">
                    ({section.title}
                    {section.instruction ? ` — ${section.instruction}` : ""})
                  </p>

                  <ol className="list-none">
                    {section.questions.map((question, questionIndex) => {
                      const showOptions = hasDisplayableOptions(question);
                      const lines = showOptions
                        ? 0
                        : answerLineCountForQuestionType(sectionQuestionType);

                      return (
                        <li
                          key={`${sectionIndex}-${questionIndex}`}
                          className="preview-exam-question"
                        >
                          <div className="preview-exam-question__row">
                            <span className="preview-exam-question__num">
                              {questionIndex + 1}.
                            </span>
                            <p className="preview-exam-question__text">
                              {question.question}
                            </p>
                            <span className="preview-exam-question__marks">
                              [{question.marks} marks]
                            </span>
                            <span className="preview-exam-question__difficulty">
                              {question.difficulty}
                            </span>
                          </div>

                          {showOptions ? (
                            <ul className="preview-exam-question__options">
                              {question.options!.map((option, optionIndex) => (
                                <li
                                  key={`${sectionIndex}-${questionIndex}-${optionIndex}`}
                                  className="preview-exam-question__option"
                                >
                                  <span className="preview-exam-question__option-label">
                                    {formatOptionLabel(optionIndex)}.
                                  </span>
                                  <span className="preview-exam-question__option-text">
                                    {option}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : null}

                          {lines > 0 ? (
                            <div className="preview-exam-question__answer-lines">
                              {Array.from({ length: lines }).map(
                                (_, lineIndex) => (
                                  <div
                                    key={lineIndex}
                                    className="preview-exam-question__answer-line"
                                    aria-hidden
                                  />
                                ),
                              )}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </>
        ) : (
          <div className="preview-exam-empty">
            <p className="preview-exam-empty__title">
              Paper preview not available yet
            </p>
            <p className="preview-exam-empty__hint">
              Generated content will appear here once processing completes.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
