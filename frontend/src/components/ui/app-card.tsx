import { cn } from "@/lib/utils/cn";

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

/** Standard elevated surface card — Stitch design system. */
export function AppCard({
  children,
  className,
  as: Tag = "div",
}: AppCardProps) {
  return <Tag className={cn("app-card", className)}>{children}</Tag>;
}
