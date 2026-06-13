import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  meta?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  meta,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("page-header", className)}>
      <div className="page-header__content">
        {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? (
          <p className="page-header__description">{description}</p>
        ) : null}
        {meta ? <p className="page-header__meta">{meta}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
