import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: MetricCardProps) {
  return (
    <article className={cn("metric-card", className)}>
      {Icon ? (
        <div className="metric-card__icon">
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </div>
      ) : null}
      <div className="metric-card__content">
        <span className="metric-card__value">{value}</span>
        <span className="metric-card__label">{label}</span>
        {hint ? <span className="metric-card__hint">{hint}</span> : null}
      </div>
    </article>
  );
}
