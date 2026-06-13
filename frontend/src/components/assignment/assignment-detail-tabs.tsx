"use client";

import { useState } from "react";
import { AssignmentMetadataPanel } from "@/components/assignment/assignment-metadata-panel";
import { AssignmentPreview } from "@/components/assignment/assignment-preview";
import { AssignmentSolutionsComingSoon } from "@/components/assignment/assignment-solutions-coming-soon";
import type { Assignment } from "@/types/assignment";

type DetailTab = "preview" | "solutions" | "metadata";

interface AssignmentDetailTabsProps {
  assignment: Assignment;
  onRegenerate?: () => void;
}

const TABS: { id: DetailTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "solutions", label: "Solutions" },
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
        {activeTab === "solutions" ? <AssignmentSolutionsComingSoon /> : null}
        {activeTab === "metadata" ? (
          <AssignmentMetadataPanel assignment={assignment} />
        ) : null}
      </div>
    </div>
  );
}
