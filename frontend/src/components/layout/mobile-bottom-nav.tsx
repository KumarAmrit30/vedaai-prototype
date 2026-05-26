"use client";

import {
  BookOpen,
  Home,
  Library,
  Plus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { NavItemId } from "@/components/layout/sidebar";

interface MobileNavItem {
  id: NavItemId;
  label: string;
  icon: LucideIcon;
}

const mobileNavItems: MobileNavItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "library", label: "Library", icon: Library },
  { id: "generate", label: "AI Toolkit", icon: Sparkles },
];

interface MobileBottomNavProps {
  activeItem?: NavItemId;
  onNavigate?: (id: NavItemId) => void;
  onCreateClick?: () => void;
}

export function MobileBottomNav({
  activeItem = "dashboard",
  onNavigate,
  onCreateClick,
}: MobileBottomNavProps) {
  return (
    <>
      <div className="mobile-nav-shell md:hidden">
        <button
          type="button"
          onClick={onCreateClick}
          aria-label="Create assignment"
          className="mobile-fab"
        >
          <Plus className="mobile-fab__icon" strokeWidth={2.5} />
        </button>
      </div>

      <nav className="mobile-nav-wrap md:hidden" aria-label="Mobile navigation">
        <div className="mobile-nav-bar mx-auto max-w-md">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate?.(item.id)}
                className={`mobile-nav-item${isActive ? " mobile-nav-item--active" : ""}`}
              >
                <Icon
                  className="mobile-nav-item__icon"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
