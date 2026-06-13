"use client";

import type { LucideIcon } from "lucide-react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: SettingsSectionProps) {
  return (
    <section className="surface-card-compact p-5 md:p-6">
      <header className="mb-5 flex items-start gap-3">
        {Icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border-light)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

interface SettingsDetailRowProps {
  label: string;
  value: React.ReactNode;
}

export function SettingsDetailRow({
  label,
  value,
}: SettingsDetailRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--border-subtle)] py-3 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-[12px] font-medium text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="text-[13px] font-medium text-[var(--text-primary)] sm:text-right">
        {value}
      </dd>
    </div>
  );
}
