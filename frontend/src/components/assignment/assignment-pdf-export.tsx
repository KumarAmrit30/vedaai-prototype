"use client";

import type { CSSProperties } from "react";
import { formatAssignmentDate } from "@/lib/utils/format-assignment";
import {
  PDF_COLORS,
  PDF_EXPORT_WIDTH_PX,
  PDF_FONT_FAMILY,
} from "@/lib/utils/export-pdf-colors";
import type { Assignment } from "@/types/assignment";

function answerLineCount(questionType: string): number {
  if (questionType === "long-answer") return 3;
  if (questionType === "short-answer") return 2;
  return 1;
}

const box: CSSProperties = { boxSizing: "border-box" };

interface AssignmentPdfExportProps {
  assignment: Assignment;
}

/**
 * Export-only assignment layout. Uses inline hex styles only — never theme classes or CSS variables.
 * Rendered inside an isolated iframe for html2canvas capture.
 */
export function AssignmentPdfExport({ assignment }: AssignmentPdfExportProps) {
  const { generatedPaper, questionConfig } = assignment;
  const totalMarks =
    questionConfig.numberOfQuestions * questionConfig.marksPerQuestion;

  const allQuestions =
    generatedPaper?.sections.flatMap((section, sectionIndex) =>
      section.questions.map((question, questionIndex) => ({
        key: `${sectionIndex}-${questionIndex}`,
        label: `Q${questionIndex + 1}`,
        marks: question.marks,
        difficulty: question.difficulty,
      })),
    ) ?? [];

  const metaItems = [
    `Subject: ${assignment.topic}`,
    `Due: ${formatAssignmentDate(assignment.dueDate, "long")}`,
    `Questions: ${questionConfig.numberOfQuestions}`,
    `Marks: ${totalMarks}`,
  ];

  return (
    <article
      data-assignment-paper
      style={{
        ...box,
        width: PDF_EXPORT_WIDTH_PX,
        margin: 0,
        padding: "48px 56px 56px",
        backgroundColor: PDF_COLORS.white,
        color: PDF_COLORS.text,
        fontFamily: PDF_FONT_FAMILY,
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <header
        style={{
          ...box,
          textAlign: "center",
          paddingBottom: 16,
          borderBottom: `1px solid ${PDF_COLORS.borderStrong}`,
        }}
      >
        <h1
          style={{
            ...box,
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.2,
            color: PDF_COLORS.text,
          }}
        >
          Springdale High School
        </h1>
        <h2
          style={{
            ...box,
            margin: "8px 0 0",
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.35,
            color: PDF_COLORS.text,
          }}
        >
          {assignment.title}
        </h2>
        <div
          style={{
            ...box,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 14,
            fontSize: 13,
            color: PDF_COLORS.textSecondary,
          }}
        >
          {metaItems.map((item, index) => (
            <span
              key={item}
              style={{
                ...box,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {index > 0 ? (
                <span
                  style={{
                    margin: "0 10px",
                    color: PDF_COLORS.separator,
                  }}
                >
                  |
                </span>
              ) : null}
              {item}
            </span>
          ))}
        </div>
      </header>

      {assignment.instructions ? (
        <section style={{ ...box, margin: "20px 0 24px" }}>
          <span
            style={{
              ...box,
              display: "block",
              marginBottom: 6,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: PDF_COLORS.textMuted,
            }}
          >
            General Instructions
          </span>
          <p
            style={{
              ...box,
              margin: 0,
              fontSize: 13,
              lineHeight: 1.65,
              color: PDF_COLORS.textSecondary,
            }}
          >
            {assignment.instructions}
          </p>
        </section>
      ) : null}

      {generatedPaper?.sections?.length ? (
        <>
          {generatedPaper.sections.map((section, sectionIndex) => (
            <section key={`${section.title}-${sectionIndex}`} style={{ ...box, marginBottom: 28 }}>
              <h3
                style={{
                  ...box,
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: PDF_COLORS.textMuted,
                }}
              >
                Section {String.fromCharCode(65 + sectionIndex)}
              </h3>
              <p
                style={{
                  ...box,
                  margin: "4px 0 0",
                  fontSize: 13,
                  fontStyle: "italic",
                  color: PDF_COLORS.textSecondary,
                }}
              >
                ({section.title}
                {section.instruction ? ` — ${section.instruction}` : ""})
              </p>

              <ol style={{ ...box, listStyle: "none", margin: 0, padding: 0 }}>
                {section.questions.map((question, questionIndex) => {
                  const lines = answerLineCount(questionConfig.questionType);

                  return (
                    <li
                      key={`${sectionIndex}-${questionIndex}`}
                      style={{ ...box, marginTop: 18 }}
                    >
                      <div
                        style={{
                          ...box,
                          display: "grid",
                          gridTemplateColumns: "28px 1fr auto auto",
                          gap: "8px 10px",
                          alignItems: "start",
                        }}
                      >
                        <span
                          style={{
                            ...box,
                            fontSize: 13,
                            fontWeight: 600,
                            color: PDF_COLORS.text,
                          }}
                        >
                          {questionIndex + 1}.
                        </span>
                        <p
                          style={{
                            ...box,
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.55,
                            color: PDF_COLORS.text,
                          }}
                        >
                          {question.question}
                        </p>
                        <span
                          style={{
                            ...box,
                            fontSize: 11,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            color: PDF_COLORS.textSecondary,
                          }}
                        >
                          [{question.marks} marks]
                        </span>
                        <span
                          style={{
                            ...box,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            color: PDF_COLORS.textMuted,
                          }}
                        >
                          {question.difficulty}
                        </span>
                      </div>
                      <div
                        style={{
                          ...box,
                          marginTop: 10,
                          marginLeft: 28,
                          display: "flex",
                          flexDirection: "column",
                          gap: 14,
                        }}
                      >
                        {Array.from({ length: lines }).map((_, lineIndex) => (
                          <div
                            key={lineIndex}
                            aria-hidden
                            style={{
                              ...box,
                              height: 1,
                              backgroundColor: PDF_COLORS.answerLine,
                            }}
                          />
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}

          {allQuestions.length > 0 ? (
            <section
              style={{
                ...box,
                marginTop: 32,
                paddingTop: 20,
                borderTop: `1px solid ${PDF_COLORS.border}`,
              }}
            >
              <h3
                style={{
                  ...box,
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: PDF_COLORS.textMuted,
                }}
              >
                Answer Key Summary
              </h3>
              <div
                style={{
                  ...box,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {allQuestions.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      ...box,
                      padding: "8px 10px",
                      border: `1px solid ${PDF_COLORS.border}`,
                      borderRadius: 6,
                      fontSize: 11,
                      color: PDF_COLORS.textSecondary,
                      backgroundColor: PDF_COLORS.keyBackground,
                    }}
                  >
                    <strong
                      style={{
                        ...box,
                        display: "block",
                        marginBottom: 2,
                        color: PDF_COLORS.text,
                      }}
                    >
                      {item.label}
                    </strong>
                    <span>
                      {item.marks}m · {item.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <div style={{ ...box, marginTop: 24, textAlign: "center" }}>
          <p style={{ ...box, margin: 0, fontWeight: 500, color: PDF_COLORS.text }}>
            Paper preview not available yet
          </p>
          <p style={{ ...box, margin: "4px 0 0", fontSize: 12, color: PDF_COLORS.textSecondary }}>
            Generated content will appear here once processing completes.
          </p>
        </div>
      )}
    </article>
  );
}
