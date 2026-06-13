"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  readGenerationPreferences,
  writeGenerationPreferences,
  type GenerationPreferences,
} from "@/lib/preferences/generation-preferences";
import {
  DIFFICULTY_LEVEL_OPTIONS,
  EXAM_PATTERN_OPTIONS,
} from "@/lib/constants/exam-blueprint";
import { SettingsSection } from "@/components/settings/settings-section";

export function GenerationPreferencesSection() {
  const [preferences, setPreferences] = useState<GenerationPreferences>(() =>
    readGenerationPreferences(),
  );

  function updatePreference<K extends keyof GenerationPreferences>(
    key: K,
    value: GenerationPreferences[K],
  ): void {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    writeGenerationPreferences(next);
  }

  return (
    <SettingsSection
      title="Generation Preferences"
      description="Defaults applied when creating new assignments."
      icon={Sparkles}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Default Exam Pattern</span>
          <select
            className="form-input form-select"
            value={preferences.defaultExamPattern}
            onChange={(event) =>
              updatePreference(
                "defaultExamPattern",
                event.target.value as GenerationPreferences["defaultExamPattern"],
              )
            }
          >
            {EXAM_PATTERN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="form-label">Default Difficulty</span>
          <select
            className="form-input form-select"
            value={preferences.defaultDifficulty}
            onChange={(event) =>
              updatePreference(
                "defaultDifficulty",
                event.target.value as GenerationPreferences["defaultDifficulty"],
              )
            }
          >
            {DIFFICULTY_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="form-label">Default Export Format</span>
          <select
            className="form-input form-select"
            value={preferences.defaultExportFormat}
            onChange={(event) =>
              updatePreference(
                "defaultExportFormat",
                event.target.value as GenerationPreferences["defaultExportFormat"],
              )
            }
          >
            <option value="pdf">PDF</option>
            <option value="docx">DOCX (Coming Soon)</option>
          </select>
        </label>

        <label className="block">
          <span className="form-label">Default Language</span>
          <select
            className="form-input form-select"
            value={preferences.defaultLanguage}
            onChange={(event) =>
              updatePreference("defaultLanguage", event.target.value)
            }
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="form-label">Default Question Style</span>
          <select
            className="form-input form-select"
            value={preferences.defaultQuestionStyle}
            onChange={(event) =>
              updatePreference(
                "defaultQuestionStyle",
                event.target.value as GenerationPreferences["defaultQuestionStyle"],
              )
            }
          >
            <option value="mixed">Mixed</option>
            <option value="mcq">Multiple Choice</option>
            <option value="subjective">Subjective</option>
          </select>
        </label>
      </div>

      <p className="mt-4 text-[12px] text-[var(--text-muted)]">
        Saved locally on this device until server-side preferences are available.
      </p>
    </SettingsSection>
  );
}
