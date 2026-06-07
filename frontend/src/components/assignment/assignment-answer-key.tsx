"use client";

import type { Assignment } from "@/types/assignment";

interface AssignmentAnswerKeyProps {
  assignment: Assignment;
}

export function AssignmentAnswerKey({ assignment }: AssignmentAnswerKeyProps) {
  const answerKey = assignment.answerKey ?? [];

  if (!answerKey.length) {
    return (
      <div className="product-state-card surface-card-compact px-6 py-8 text-center">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          No answer key available
        </h3>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          This assignment was created before answer keys were generated, or
          generation did not include marking guidance.
        </p>
      </div>
    );
  }

  const sortedEntries = [...answerKey].sort(
    (a, b) => a.questionNumber - b.questionNumber,
  );

  return (
    <div className="assignment-answer-key surface-card-compact">
      <header className="assignment-answer-key__header">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
          Answer Key
        </h3>
        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
          Expected answers, explanations, and marking guides for educators.
        </p>
      </header>

      <ol className="assignment-answer-key__entries">
        {sortedEntries.map((entry) => (
          <li
            key={entry.questionNumber}
            className="assignment-answer-key__entry"
          >
            <div className="assignment-answer-key__entry-head">
              <span className="assignment-answer-key__question-num">
                Question {entry.questionNumber}
              </span>
            </div>

            <div className="assignment-answer-key__field">
              <span className="assignment-answer-key__label">Expected Answer</span>
              <p className="assignment-answer-key__value">{entry.answer}</p>
            </div>

            <div className="assignment-answer-key__field">
              <span className="assignment-answer-key__label">Explanation</span>
              <p className="assignment-answer-key__value">{entry.explanation}</p>
            </div>

            <div className="assignment-answer-key__field">
              <span className="assignment-answer-key__label">Marking Guide</span>
              <p className="assignment-answer-key__value assignment-answer-key__value--guide">
                {entry.markingGuide}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
