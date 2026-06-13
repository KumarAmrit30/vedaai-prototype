import {
  assignmentHasGeneratedPaper,
  formatOptionLabel,
  hasDisplayableOptions,
} from "@/lib/utils/question-display";
import type { Assignment } from "@/types/assignment";

describe("question-display", () => {
  it("formats option labels A through D", () => {
    expect(formatOptionLabel(0)).toBe("A");
    expect(formatOptionLabel(3)).toBe("D");
  });

  it("detects displayable MCQ options", () => {
    expect(hasDisplayableOptions({ options: ["A", "B", "C", "D"] })).toBe(true);
    expect(hasDisplayableOptions({ options: ["Only one"] })).toBe(false);
    expect(hasDisplayableOptions({})).toBe(false);
  });

  it("requires at least one question in generatedPaper for completion eligibility", () => {
    const withPaper = {
      generatedPaper: {
        sections: [{ title: "A", instruction: "i", questions: [{ question: "Q", difficulty: "easy", marks: 1 }] }],
      },
    } as Assignment;

    const withoutPaper = {
      generatedPaper: { sections: [{ title: "A", instruction: "i", questions: [] }] },
    } as Assignment;

    expect(assignmentHasGeneratedPaper(withPaper)).toBe(true);
    expect(assignmentHasGeneratedPaper(withoutPaper)).toBe(false);
  });
});
