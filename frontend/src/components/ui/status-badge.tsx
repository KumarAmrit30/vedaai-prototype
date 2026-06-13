import { cn } from "@/lib/utils/cn";

export type StatusBadgeVariant =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", `status-badge--${variant}`, className)}>
      {children}
    </span>
  );
}
