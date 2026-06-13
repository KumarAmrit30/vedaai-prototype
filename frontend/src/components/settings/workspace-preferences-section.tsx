"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import {
  readWorkspacePreferences,
  writeWorkspacePreferences,
  type WorkspacePreferences,
} from "@/lib/preferences/workspace-preferences";
import { SettingsSection } from "@/components/settings/settings-section";
import { useUserStore } from "@/store/user.store";

export function WorkspacePreferencesSection() {
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() =>
    readWorkspacePreferences(),
  );
  const billingGenerationsUsed = useUserStore(
    (state) => state.billingProfile?.usage.assignmentsGenerated,
  );
  const profileGenerationsUsed = useUserStore(
    (state) => state.profile?.usage.assignmentsGenerated,
  );
  const generationsUsed =
    billingGenerationsUsed ?? profileGenerationsUsed ?? 0;

  function updatePreference<K extends keyof WorkspacePreferences>(
    key: K,
    value: WorkspacePreferences[K],
  ): void {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    writeWorkspacePreferences(next);
  }

  return (
    <SettingsSection
      title="Workspace Preferences"
      description="Control how your assignment workspace behaves."
      icon={LayoutGrid}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface-muted)] px-4 py-3">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            Auto-save
          </span>
          <input
            type="checkbox"
            checked={preferences.autoSave}
            onChange={(event) =>
              updatePreference("autoSave", event.target.checked)
            }
            className="h-4 w-4 accent-[var(--accent-primary)]"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface-muted)] px-4 py-3">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            Analytics widgets
          </span>
          <input
            type="checkbox"
            checked={preferences.showAnalyticsWidgets}
            onChange={(event) =>
              updatePreference("showAnalyticsWidgets", event.target.checked)
            }
            className="h-4 w-4 accent-[var(--accent-primary)]"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="form-label">Assignment sort order</span>
        <select
          className="form-input form-select"
          value={preferences.sortOrder}
          onChange={(event) =>
            updatePreference(
              "sortOrder",
              event.target.value as WorkspacePreferences["sortOrder"],
            )
          }
        >
          <option value="recent">Most recent first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
      </label>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="metric-card">
          <div className="metric-card__content">
            <span className="metric-card__value">{generationsUsed}</span>
            <span className="metric-card__label">Assignments generated</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card__content">
            <span className="metric-card__value capitalize">
              {preferences.sortOrder}
            </span>
            <span className="metric-card__label">Current sort order</span>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
