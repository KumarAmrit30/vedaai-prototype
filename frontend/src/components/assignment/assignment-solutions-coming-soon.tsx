"use client";

import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";

const FEATURES = [
  {
    title: "Step-by-step explanations",
    description:
      "Detailed worked solutions for every question, aligned to your exam pattern and marking scheme.",
    icon: BookOpenCheck,
  },
  {
    title: "Difficulty analysis",
    description:
      "See how each question maps to Bloom's levels and your chosen difficulty profile.",
    icon: BarChart3,
  },
  {
    title: "Rubric generation",
    description:
      "Auto-generated marking guides and partial-credit rubrics for subjective sections.",
    icon: ClipboardCheck,
  },
];

export function AssignmentSolutionsComingSoon() {
  return (
    <div className="solutions-preview">
      <div className="solutions-preview__hero stitch-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="solutions-preview__hero-icon">
            <Sparkles className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-[18px] font-semibold text-[var(--text-primary)]">
                Solutions
              </h3>
              <ComingSoonBadge compact />
            </div>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Answer keys, explanations, and marking guides are on the roadmap.
              Use Preview to review and export your generated paper today.
            </p>
          </div>
        </div>
      </div>

      <div className="solutions-preview__grid">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="stitch-card stitch-card--compact solutions-preview__card"
          >
            <div className="solutions-preview__card-icon">
              <feature.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </div>
            <h4 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
              {feature.title}
            </h4>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
