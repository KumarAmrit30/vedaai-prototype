"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileUp,
  Sparkles,
} from "lucide-react";
import type { ActivityEvent } from "@/lib/utils/dashboard-analytics";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";

interface DashboardActivityFeedProps {
  events: ActivityEvent[];
}

function ActivityIcon({ type }: { type: ActivityEvent["type"] }) {
  switch (type) {
    case "exam_generated":
      return <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />;
    case "pdf_ready":
      return <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />;
    case "material_uploaded":
      return <FileUp className="h-3.5 w-3.5" strokeWidth={2} />;
    case "generation_failed":
      return <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />;
    default:
      return <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />;
  }
}

export function DashboardActivityFeed({ events }: DashboardActivityFeedProps) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) {
    return (
      <section className="stitch-card dashboard-activity">
        <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
          Recent Activity
        </h2>
        <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
          Activity from generation and uploads will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="stitch-card dashboard-activity">
      <button
        type="button"
        className="dashboard-activity__header md:pointer-events-none"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
          Recent Activity
        </h2>
        <ChevronDown
          className={`dashboard-activity__chevron h-4 w-4 md:hidden${
            expanded ? " dashboard-activity__chevron--open" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      <ol
        className={`dashboard-activity__list${
          expanded ? " dashboard-activity__list--open" : ""
        }`}
      >
        {events.map((event) => (
          <li key={event.id} className="dashboard-activity__item">
            <div className="dashboard-activity__icon">
              <ActivityIcon type={event.type} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[13px] font-medium text-[var(--text-primary)]">
                {event.title}
              </p>
              <p className="truncate text-[13px] text-[var(--text-secondary)]">
                {event.subtitle}
              </p>
            </div>
            <time
              className="dashboard-activity__time shrink-0 text-[11px] text-[var(--text-muted)]"
              dateTime={event.timestamp}
            >
              {formatRelativeTime(event.timestamp)}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
