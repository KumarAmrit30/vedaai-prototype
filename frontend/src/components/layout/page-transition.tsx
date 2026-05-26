"use client";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return <div className="page-transition flow-step-panel">{children}</div>;
}
