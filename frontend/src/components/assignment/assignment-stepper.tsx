"use client";

import { Check } from "lucide-react";

export type FlowStepId = "details" | "upload" | "generate" | "preview";

export interface FlowStep {
  id: FlowStepId;
  label: string;
  shortLabel: string;
}

export const FLOW_STEPS: FlowStep[] = [
  { id: "details", label: "Assignment Details", shortLabel: "Details" },
  { id: "upload", label: "Upload Materials", shortLabel: "Upload" },
  { id: "generate", label: "Generate", shortLabel: "Generate" },
  { id: "preview", label: "Preview Output", shortLabel: "Preview" },
];

interface AssignmentStepperProps {
  currentStep: FlowStepId;
}

function getStepIndex(stepId: FlowStepId): number {
  return FLOW_STEPS.findIndex((step) => step.id === stepId);
}

export function AssignmentStepper({ currentStep }: AssignmentStepperProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <nav aria-label="Assignment creation progress" className="flow-stepper">
      {FLOW_STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const stepClass = isActive
          ? "flow-step flow-step--active"
          : isComplete
            ? "flow-step flow-step--complete"
            : "flow-step";

        return (
          <div key={step.id} className="flex shrink-0 items-center">
            <div className={stepClass}>
              <span className="flow-step__circle">
                {isComplete ? (
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              <span className="flow-step__label flow-step__label--desktop hidden sm:inline">
                {step.label}
              </span>
              <span className="flow-step__label flow-step__label--mobile sm:hidden">
                {step.shortLabel}
              </span>
            </div>

            {index < FLOW_STEPS.length - 1 ? (
              <span
                className={`flow-step__connector${
                  index < currentIndex ? " flow-step__connector--complete" : ""
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
