"use client";

import {
  Bell,
  CreditCard,
  FileCheck2,
  Gauge,
  Megaphone,
  Share2,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { useShellNavigation } from "@/hooks/use-shell-navigation";

const CATEGORIES = [
  {
    id: "generation",
    label: "Generation",
    items: [
      {
        title: "Paper Generated",
        body: "Sample: A generated exam is ready to preview and export.",
        icon: Sparkles,
        time: "Sample",
      },
      {
        title: "Ready for Export",
        body: "Sample: A completed paper can be exported as PDF.",
        icon: FileCheck2,
        time: "Sample",
      },
      {
        title: "Plan Limit Reached",
        body: "Sample: Assignment generation limit notification.",
        icon: Gauge,
        time: "Sample",
        muted: true,
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        title: "Assignment Shared",
        body: "Sample: A colleague shares a draft with your department.",
        icon: Share2,
        time: "Sample",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    items: [
      {
        title: "Plan Renewal",
        body: "Sample: Subscription renewal reminder.",
        icon: CreditCard,
        time: "Sample",
        muted: true,
      },
    ],
  },
  {
    id: "product",
    label: "Product Updates",
    items: [
      {
        title: "New Feature",
        body: "Sample: Product update announcement.",
        icon: Megaphone,
        time: "Sample",
      },
    ],
  },
];

export default function NotificationsPage() {
  const { handleNavigate, navigateToCreate, comingSoon } = useShellNavigation();

  return (
    <AppShell
      title="Notifications"
      subtitle="Generation, workspace, and billing alerts"
      activeNav="dashboard"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
        <section className="feature-preview-hero">
          <div className="flex flex-wrap items-center gap-3">
            <div className="solutions-preview__hero-icon">
              <Bell className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
                  Notifications Preview
                </h1>
                <ComingSoonBadge />
              </div>
              <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                Sample notifications are shown below. Personalized alerts for
                your account will be available in a future release.
              </p>
            </div>
          </div>
        </section>

        <div
          className="rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface-muted)] px-4 py-3 text-[13px] text-[var(--text-secondary)]"
          role="note"
        >
          These are illustrative examples only — not your account activity.
        </div>

        {CATEGORIES.map((category) => (
          <section key={category.id} className="notification-category">
            <h2 className="font-display text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {category.label}
            </h2>
            {category.items.map((item) => (
              <article
                key={item.title}
                className={`notification-item-preview feature-preview-card--blurred${
                  item.muted ? " notification-item-preview--muted" : ""
                }`}
                aria-label={`Sample notification: ${item.title}`}
              >
                <div className="metric-card__icon shrink-0">
                  <item.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </section>
        ))}

        <section className="stitch-card">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
              Notification Settings
            </h2>
            <ComingSoonBadge compact />
          </div>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Configure alerts from Settings when notifications launch.
          </p>
          <div className="mt-4 opacity-60" aria-disabled="true">
            {["Generation complete", "Ready for export", "Usage limits", "Product updates"].map(
              (label) => (
                <div key={label} className="settings-toggle-row">
                  <span className="text-[13px] text-[var(--text-primary)]">
                    {label}
                  </span>
                  <div className="settings-toggle" aria-hidden="true" />
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
