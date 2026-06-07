"use client";

import {
  BookOpen,
  Home,
  Library,
  LogIn,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { PlanBadge } from "@/components/ui/plan-badge";
import {
  getUserDisplayName,
  getUserInitials,
} from "@/lib/auth/user-display";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";

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
  comingSoon?: boolean;
}

const mainNavItems: NavItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "groups", label: "My Groups", icon: Users, comingSoon: true },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "generate", label: "AI Teacher's Toolkit", icon: Sparkles },
  { id: "library", label: "My Library", icon: Library, comingSoon: true },
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
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.signOut);
  const profile = useUserStore((state) => state.profile);

  const isAuthLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && Boolean(user);
  const displayName = isAuthenticated && user ? getUserDisplayName(user) : "Guest User";
  const initials = isAuthenticated && user ? getUserInitials(user) : "GU";
  const email = user?.email ?? "";

  const plan = profile?.plan ?? "free";
  const generationsUsed = profile?.usage.assignmentsGenerated ?? 0;
  const generationsAllowed = profile?.limits.assignmentsAllowed ?? null;
  const usageLabel =
    generationsAllowed === null
      ? `${generationsUsed} Generations Used`
      : `${generationsUsed} / ${generationsAllowed} Generations Used`;

  async function handleSignOut(): Promise<void> {
    await signOut();
    router.replace("/");
  }

  function handleSignIn(): void {
    const next = encodeURIComponent(pathname ?? "/");
    router.push(`/login?next=${next}`);
  }

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
              aria-label={
                item.comingSoon ? `${item.label} (coming soon)` : item.label
              }
              title={
                item.comingSoon ? `${item.label} — Coming soon` : item.label
              }
              className={`sidebar-item${isActive ? " active" : ""}`}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
              <span className="sidebar-item__label min-w-0 flex-1 truncate">
                {item.label}
              </span>
              {item.comingSoon ? (
                <span className="sidebar-item__soon hidden min-[1180px]:inline-flex">
                  <ComingSoonBadge />
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-shell__footer mt-auto flex flex-col gap-px px-2 pb-3">
        <button
          type="button"
          onClick={() => onNavigate?.("settings")}
          aria-label="Settings (coming soon)"
          title="Settings — Coming soon"
          className={`sidebar-item${activeItem === "settings" ? " active" : ""}`}
        >
          <Settings className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
          <span className="sidebar-item__label min-w-0 flex-1">Settings</span>
          <span className="sidebar-item__soon hidden min-[1180px]:inline-flex">
            <ComingSoonBadge />
          </span>
        </button>

        {isAuthLoading ? (
          <div
            className="sidebar-shell__profile mt-1 flex items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-2"
            aria-hidden="true"
          >
            <div className="shimmer-block h-7 w-7 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="shimmer-block h-3 w-24" />
              <div className="shimmer-block h-2.5 w-32" />
            </div>
          </div>
        ) : (
          <>
            <div className="sidebar-shell__profile mt-1 flex items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-2">
              {isAuthenticated && user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  className="sidebar-shell__profile-avatar h-7 w-7 shrink-0 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="sidebar-shell__profile-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--orange-primary)] text-[9px] font-bold text-[var(--black-primary)]">
                  {initials}
                </div>
              )}
              <div className="sidebar-shell__profile-text min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
                  {displayName}
                </p>
                <p className="truncate text-[10px] text-[var(--text-muted)]">
                  {isAuthenticated
                    ? email || "Signed in with Google"
                    : "Not signed in"}
                </p>
              </div>
            </div>

            <div className="sidebar-shell__plan mt-1 flex flex-col gap-1 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-2">
              <PlanBadge plan={plan} className="self-start" />
              <p className="truncate text-[10px] text-[var(--text-muted)]">
                {isAuthenticated ? usageLabel : "Sign in to start generating"}
              </p>
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="sidebar-item mt-1"
                aria-label="Sign out"
              >
                <LogOut className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
                <span className="sidebar-item__label min-w-0 flex-1">Sign out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="create-assignment-btn mt-1"
                aria-label="Continue with Google"
              >
                <LogIn className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                <span className="create-assignment-btn__label">
                  Continue with Google
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

export { mainNavItems as navItems };
