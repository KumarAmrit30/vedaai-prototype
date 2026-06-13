"use client";

import { Sparkles } from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import {
  DIFFICULTY_LEVEL_OPTIONS,
  EXAM_PATTERN_OPTIONS,
} from "@/lib/constants/exam-blueprint";
import { SettingsSection } from "@/components/settings/settings-section";

export function GenerationPreferencesSection() {
  return (
    <SettingsSection
      title="Generation Preferences"
      description="Default options for new assignments."
      icon={Sparkles}
    >
      <div className="mb-4 flex items-center gap-2">
        <ComingSoonBadge />
      </div>
      <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
        Default exam pattern, difficulty, language, and export format will apply
        when creating assignments in a future release. These controls are not
        active yet.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2" aria-disabled="true">
        <label className="block opacity-60">
          <span className="form-label">Default Exam Pattern</span>
          <select className="form-input form-select" disabled defaultValue="CUSTOM">
            {EXAM_PATTERN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block opacity-60">
          <span className="form-label">Default Difficulty</span>
          <select className="form-input form-select" disabled defaultValue="MEDIUM">
            {DIFFICULTY_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block opacity-60">
          <span className="form-label">Default Export Format</span>
          <select className="form-input form-select" disabled defaultValue="pdf">
            <option value="pdf">PDF</option>
          </select>
        </label>

        <label className="block opacity-60">
          <span className="form-label">Default Language</span>
          <select className="form-input form-select" disabled defaultValue="English">
            <option value="English">English</option>
          </select>
        </label>

        <label className="block opacity-60 sm:col-span-2">
          <span className="form-label">Default Question Style</span>
          <select className="form-input form-select" disabled defaultValue="mixed">
            <option value="mixed">Mixed</option>
          </select>
        </label>
      </div>
    </SettingsSection>
  );
}
