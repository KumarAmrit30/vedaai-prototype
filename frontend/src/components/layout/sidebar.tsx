"use client";

import {
  BookOpen,
  Home,
  Library,
  Plus,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItemId =
  | "dashboard"
  | "groups"
  | "assignments"
  | "generate"
  | "library"
  | "settings";

interface NavItem {
  id: NavItemId;
  label: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "groups", label: "My Groups", icon: Users },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "generate", label: "AI Teacher's Toolkit", icon: Sparkles },
  { id: "library", label: "My Library", icon: Library },
];

interface SidebarProps {
  activeItem?: NavItemId;
  onNavigate?: (id: NavItemId) => void;
  onCreateClick?: () => void;
}

export function Sidebar({
  activeItem = "dashboard",
  onNavigate,
  onCreateClick,
}: SidebarProps) {
  return (
    <aside className="sidebar-shell hidden h-full shrink-0 flex-col md:flex">
      <div className="sidebar-shell__header flex flex-col gap-3 px-3 pt-4 pb-2">
        <div className="sidebar-shell__brand flex items-center gap-2">
          <div className="sidebar-shell__logo flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--black-primary)] text-[10px] font-bold text-white">
            E
          </div>
          <div className="sidebar-shell__brand-text min-w-0">
            <p className="text-[14px] font-semibold leading-none tracking-[-0.02em] text-[var(--text-primary)]">
              ExamForge AI
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              Exam Generation Platform
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateClick}
          aria-label="Create Assignment"
          className="create-assignment-btn"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          <span className="create-assignment-btn__label">Create Assignment</span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-px overflow-y-auto px-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
              aria-label={item.label}
              title={item.label}
              className={`sidebar-item${isActive ? " active" : ""}`}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
              <span className="sidebar-item__label truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-shell__footer mt-auto flex flex-col gap-px px-2 pb-3">
        <button
          type="button"
          onClick={() => onNavigate?.("settings")}
          aria-label="Settings"
          title="Settings"
          className={`sidebar-item${activeItem === "settings" ? " active" : ""}`}
        >
          <Settings className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
          <span className="sidebar-item__label">Settings</span>
        </button>

        <div className="sidebar-shell__profile mt-1 flex items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-2">
          <div className="sidebar-shell__profile-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--orange-primary)] text-[9px] font-bold text-[var(--black-primary)]">
            DW
          </div>
          <div className="sidebar-shell__profile-text min-w-0">
            <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
              Demo Workspace
            </p>
            <p className="truncate text-[10px] text-[var(--text-muted)]">
              Workspace profile
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { mainNavItems as navItems };
