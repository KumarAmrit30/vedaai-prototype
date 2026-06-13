"use client";

import { LayoutGrid } from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { SettingsSection } from "@/components/settings/settings-section";
import { useUserStore } from "@/store/user.store";

export function WorkspacePreferencesSection() {
  const billingGenerationsUsed = useUserStore(
    (state) => state.billingProfile?.usage.assignmentsGenerated,
  );
  const profileGenerationsUsed = useUserStore(
    (state) => state.profile?.usage.assignmentsGenerated,
  );
  const generationsUsed =
    billingGenerationsUsed ?? profileGenerationsUsed ?? 0;

  return (
    <SettingsSection
      title="Workspace Preferences"
      description="Control how your assignment workspace behaves."
      icon={LayoutGrid}
    >
      <div className="mb-4 flex items-center gap-2">
        <ComingSoonBadge />
      </div>
      <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
        Auto-save, analytics widgets, and default sort order are not available
        yet. The controls below are disabled until this feature ships.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2" aria-disabled="true">
        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface-muted)] px-4 py-3 opacity-60">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            Auto-save
          </span>
          <input
            type="checkbox"
            disabled
            defaultChecked
            className="h-4 w-4 accent-[var(--accent-primary)]"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface-muted)] px-4 py-3 opacity-60">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            Analytics widgets
          </span>
          <input
            type="checkbox"
            disabled
            defaultChecked
            className="h-4 w-4 accent-[var(--accent-primary)]"
          />
        </label>
      </div>

      <label className="mt-4 block opacity-60">
        <span className="form-label">Assignment sort order</span>
        <select className="form-input form-select" disabled defaultValue="recent">
          <option value="recent">Most recent first</option>
        </select>
      </label>

      <div className="mt-6">
        <div className="metric-card">
          <div className="metric-card__content">
            <span className="metric-card__value">{generationsUsed}</span>
            <span className="metric-card__label">Lifetime assignments generated</span>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
