"use client";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Sidebar, type NavItemId } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAssignmentSocket } from "@/hooks/use-assignment-socket";

interface AppShellProps {
  title?: string;
  subtitle?: string;
  activeNav?: NavItemId;
  children: React.ReactNode;
  onCreateClick?: () => void;
  onNavigate?: (id: NavItemId) => void;
}

export function AppShell({
  title,
  subtitle,
  activeNav = "dashboard",
  children,
  onCreateClick,
  onNavigate,
}: AppShellProps) {
  useAssignmentSocket();

  return (
    <div className="app-shell">
      <div className="app-shell__frame">
        <div className="app-shell__sidebar-slot">
          <Sidebar
            activeItem={activeNav}
            onNavigate={onNavigate}
            onCreateClick={onCreateClick}
          />
        </div>

        <div className="app-shell__main">
          <div className="app-shell__topbar">
            <Topbar title={title} subtitle={subtitle} />
          </div>

          <main className="app-shell__workspace mobile-main-content">
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav
        activeItem={activeNav}
        onNavigate={onNavigate}
        onCreateClick={onCreateClick}
      />
    </div>
  );
}
