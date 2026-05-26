"use client";

import { useState } from "react";
import { AssignmentAnswerKey } from "@/components/assignment/assignment-answer-key";
import { AssignmentMetadataPanel } from "@/components/assignment/assignment-metadata-panel";
import { AssignmentPreview } from "@/components/assignment/assignment-preview";
import type { Assignment } from "@/types/assignment";

type DetailTab = "preview" | "answer-key" | "metadata";

interface AssignmentDetailTabsProps {
  assignment: Assignment;
  onRegenerate?: () => void;
}

const TABS: { id: DetailTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "answer-key", label: "Answer Key" },
  { id: "metadata", label: "Metadata" },
];

export function AssignmentDetailTabs({
  assignment,
  onRegenerate,
}: AssignmentDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("preview");

  return (
    <div className="assignment-detail-tabs">
      <div className="assignment-detail-tabs__bar scrollbar-hide">
        <div className="assignment-detail-tabs__inner">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`filter-pill shrink-0${
                activeTab === tab.id ? " filter-pill--active" : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="assignment-detail-tabs__panel">
        {activeTab === "preview" ? (
          <AssignmentPreview
            assignment={assignment}
            onRegenerate={onRegenerate}
            showDone={false}
          />
        ) : null}
        {activeTab === "answer-key" ? (
          <AssignmentAnswerKey assignment={assignment} />
        ) : null}
        {activeTab === "metadata" ? (
          <AssignmentMetadataPanel assignment={assignment} />
        ) : null}
      </div>
    </div>
  );
}
