"use client";

import type { Assignment } from "@/types/assignment";

interface AssignmentAnswerKeyProps {
  assignment: Assignment;
}

export function AssignmentAnswerKey({ assignment }: AssignmentAnswerKeyProps) {
  const sections = assignment.generatedPaper?.sections ?? [];

  if (!sections.length) {
    return (
      <div className="product-state-card surface-card-compact px-6 py-8 text-center">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          Answer key unavailable
        </h3>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          Generate or complete this assignment to view structured answer guidance.
        </p>
      </div>
    );
  }

  return (
    <div className="assignment-answer-key surface-card-compact">
      <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
        Answer Key Summary
      </h3>
      <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
        Marking guidance and difficulty distribution for each generated question.
      </p>

      <div className="assignment-answer-key__sections">
        {sections.map((section, sectionIndex) => (
          <section key={`${section.title}-${sectionIndex}`} className="assignment-answer-key__section">
            <h4 className="assignment-answer-key__section-title">
              Section {String.fromCharCode(65 + sectionIndex)} · {section.title}
            </h4>
            <ol className="assignment-answer-key__list">
              {section.questions.map((question, questionIndex) => (
                <li key={`${sectionIndex}-${questionIndex}`} className="assignment-answer-key__item">
                  <div className="assignment-answer-key__item-head">
                    <span>Q{questionIndex + 1}</span>
                    <span>{question.marks} marks</span>
                    <span className="capitalize">{question.difficulty}</span>
                  </div>
                  <p>{question.question}</p>
                  <p className="assignment-answer-key__guidance">
                    Expected response: structured {assignment.questionConfig.questionType.replace("-", " ")} answer demonstrating topic mastery.
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
