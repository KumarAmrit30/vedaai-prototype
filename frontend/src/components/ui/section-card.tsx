import { cn } from "@/lib/utils/cn";

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  as?: "section" | "div" | "article";
}

/** Content section with optional heading — used for settings panels and grouped content. */
export function SectionCard({
  children,
  className,
  title,
  description,
  as: Tag = "section",
}: SectionCardProps) {
  return (
    <Tag className={cn("section-card", className)}>
      {title ? (
        <header className="section-card__header">
          <h2 className="section-card__title">{title}</h2>
          {description ? (
            <p className="section-card__description">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </Tag>
  );
}
