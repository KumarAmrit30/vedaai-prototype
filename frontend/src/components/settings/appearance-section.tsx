"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import type { ThemePreference } from "@/lib/preferences/theme";
import { SettingsSection } from "@/components/settings/settings-section";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  swatchClass: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", swatchClass: "theme-preview-card__swatch--light", icon: Sun },
  { value: "dark", label: "Dark", swatchClass: "theme-preview-card__swatch--dark", icon: Moon },
  {
    value: "system",
    label: "System",
    swatchClass: "theme-preview-card__swatch--system",
    icon: Monitor,
  },
];

export function AppearanceSection() {
  const { preference, setPreference } = useTheme();

  return (
    <SettingsSection
      title="Appearance"
      description="Choose how ExamForge AI looks on this device."
      icon={Sun}
    >
      <p className="text-[13px] text-[var(--text-secondary)]">
        Theme preference is saved locally and applies across all pages.
      </p>

      <div className="theme-preview-grid">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            className={`theme-preview-card${
              preference === option.value ? " theme-preview-card--active" : ""
            }`}
            aria-pressed={preference === option.value}
          >
            <div className={`theme-preview-card__swatch ${option.swatchClass}`} />
            <span className="theme-preview-card__label">{option.label}</span>
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}
