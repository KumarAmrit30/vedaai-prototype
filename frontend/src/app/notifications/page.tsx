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
        title: "Exam Generated",
        body: "Your NEET Physics paper is ready to preview.",
        icon: Sparkles,
        time: "2 min ago",
      },
      {
        title: "PDF Ready",
        body: "CBSE Class 12 export completed successfully.",
        icon: FileCheck2,
        time: "1 hr ago",
      },
      {
        title: "Limit Reached",
        body: "You have used 5 of 5 free generations this month.",
        icon: Gauge,
        time: "Yesterday",
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
        body: "Dr. Sharma shared a Midterm draft with your department.",
        icon: Share2,
        time: "3 hr ago",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    items: [
      {
        title: "Plan Renewal",
        body: "Your Pro subscription renews on July 1.",
        icon: CreditCard,
        time: "2 days ago",
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
        body: "Solutions tab with step-by-step explanations is coming soon.",
        icon: Megaphone,
        time: "This week",
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
                  Notification Center
                </h1>
                <ComingSoonBadge />
              </div>
              <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                Preview of how generation, workspace, and billing alerts will
                appear when notifications ship.
              </p>
            </div>
          </div>
        </section>

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
              >
                <div className="metric-card__icon shrink-0">
                  <item.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <span className="text-[11px] text-[var(--text-muted)]">
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
          <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
            Notification Settings
          </h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Configure alerts from Settings when notifications launch.
          </p>
          <div className="mt-4">
            {["Generation complete", "PDF exports", "Usage limits", "Product updates"].map(
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
