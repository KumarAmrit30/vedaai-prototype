"use client";

import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { getUserDisplayName } from "@/lib/auth/user-display";
import { ROUTES } from "@/lib/navigation/routes";
import { getTimeGreeting } from "@/lib/utils/format-relative-time";
import type { User } from "firebase/auth";

interface DashboardHeroProps {
  user: User;
  usageLabel: string;
  activityHint: string;
  onCreateClick?: () => void;
}

export function DashboardHero({
  user,
  usageLabel,
  activityHint,
  onCreateClick,
}: DashboardHeroProps) {
  const name = getUserDisplayName(user);
  const greeting = getTimeGreeting();

  return (
    <section className="dashboard-hero stitch-card">
      <div className="dashboard-hero__content">
        <p className="dashboard-hero__eyebrow">{greeting}</p>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--text-primary)] md:text-[32px]">
          {name}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-[var(--text-secondary)]">
          Ready to generate today&apos;s assessments?
        </p>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">
          {usageLabel}
          {activityHint ? ` · ${activityHint}` : null}
        </p>
      </div>

      <div className="dashboard-hero__actions">
        {onCreateClick ? (
          <button type="button" onClick={onCreateClick} className="submit-pill-btn">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Generate Assignment
          </button>
        ) : (
          <Link href={ROUTES.createAssignment} className="submit-pill-btn">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Generate Assignment
          </Link>
        )}
        <Link href={ROUTES.createAssignment} className="outline-pill-btn">
          <Upload className="h-3.5 w-3.5" strokeWidth={2} />
          Upload Material
        </Link>
      </div>
    </section>
  );
}
