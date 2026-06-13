"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  LayoutTemplate,
  Plus,
  Upload,
} from "lucide-react";
import { ROUTES } from "@/lib/navigation/routes";

const ACTIONS: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    href: ROUTES.createAssignment,
    title: "Generate Assignment",
    description: "Create a new AI-generated exam from your syllabus.",
    icon: Plus,
  },
  {
    href: ROUTES.createAssignment,
    title: "Upload Material",
    description: "Start with PDF or text notes as generation source.",
    icon: Upload,
  },
  {
    href: ROUTES.createAssignment,
    title: "Browse Templates",
    description: "Pick CBSE, JEE, NEET, and other exam patterns.",
    icon: LayoutTemplate,
  },
  {
    href: ROUTES.library,
    title: "Resource Library",
    description: "Access reusable banks, templates, and notes.",
    icon: BookOpen,
  },
];

export function DashboardQuickActions() {
  return (
    <section>
      <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
        Quick Actions
      </h2>
      <div className="dashboard-quick-actions mt-4">
        {ACTIONS.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="dashboard-quick-action-card"
          >
            <div className="metric-card__icon">
              <action.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
                {action.title}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
