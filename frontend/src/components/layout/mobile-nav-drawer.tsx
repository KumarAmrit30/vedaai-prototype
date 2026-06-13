"use client";

import {
  LogIn,
  LogOut,
  Settings,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { navItems, type NavItemId } from "@/components/layout/sidebar";
import { ExamForgeLogo } from "@/components/branding/examforge-logo";
import { PlanBadge } from "@/components/ui/plan-badge";
import {
  getUserDisplayName,
  getUserInitials,
} from "@/lib/auth/user-display";
import { ROUTES } from "@/lib/navigation/routes";
import { formatSidebarUsageLabel } from "@/lib/utils/usage-label";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";

const MOBILE_DRAWER_NAV_IDS: NavItemId[] = ["dashboard", "assignments"];

const drawerNavItems = navItems.filter((item) =>
  MOBILE_DRAWER_NAV_IDS.includes(item.id),
);

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface MobileNavDrawerProps {
  open: boolean;
  activeItem?: NavItemId;
  onClose: () => void;
  onNavigate?: (id: NavItemId) => void;
}

function DrawerNavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`sidebar-item${active ? " active" : ""}`}
    >
      <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
      <span className="sidebar-item__label min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

export function MobileNavDrawer({
  open,
  activeItem = "dashboard",
  onClose,
  onNavigate,
}: MobileNavDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.signOut);
  const profile = useUserStore((state) => state.profile);
  const billingProfile = useUserStore((state) => state.billingProfile);

  const isAuthLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && Boolean(user);
  const displayName =
    isAuthenticated && user ? getUserDisplayName(user) : "Guest User";
  const initials = isAuthenticated && user ? getUserInitials(user) : "GU";
  const email = user?.email ?? "";

  const plan = billingProfile?.plan ?? profile?.plan ?? "free";
  const subscriptionStatus =
    billingProfile?.subscription.status ?? "inactive";
  const generationsUsed =
    billingProfile?.usage.assignmentsGenerated ??
    profile?.usage.assignmentsGenerated ??
    0;
  const generationsAllowed =
    billingProfile?.limits.assignmentsAllowed ??
    profile?.limits.assignmentsAllowed ??
    null;
  const usageLabel = formatSidebarUsageLabel(
    generationsUsed,
    generationsAllowed,
    isAuthenticated,
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleNavigate(id: NavItemId): void {
    onNavigate?.(id);
    onClose();
  }

  function handleUpgrade(): void {
    router.push(ROUTES.upgrade);
    onClose();
  }

  function handleSettings(): void {
    handleNavigate("settings");
  }

  async function handleSignOut(): Promise<void> {
    await signOut();
    onClose();
    router.replace("/");
  }

  function handleSignIn(): void {
    const next = encodeURIComponent(pathname ?? "/");
    onClose();
    router.push(`/login?next=${next}`);
  }

  return (
    <div
      className="mobile-nav-drawer md:hidden"
      role="presentation"
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        id="mobile-nav-drawer"
        className="mobile-nav-drawer__panel surface-card-compact"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mobile-nav-drawer__header">
          <ExamForgeLogo variant="sidebar" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="topbar-icon-btn h-8 w-8 shrink-0"
          >
            <X className="h-[15px] w-[15px]" strokeWidth={2} />
          </button>
        </div>

        <nav className="mobile-nav-drawer__nav flex flex-col gap-px">
          {drawerNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <DrawerNavButton
                key={item.id}
                label={item.label}
                icon={Icon}
                active={activeItem === item.id}
                onClick={() => handleNavigate(item.id)}
              />
            );
          })}
        </nav>

        <div className="mobile-nav-drawer__footer flex flex-col gap-px">
          <DrawerNavButton
            label="Settings"
            icon={Settings}
            active={activeItem === "settings"}
            onClick={handleSettings}
          />

          {isAuthenticated ? (
            <DrawerNavButton
              label="Upgrade"
              icon={TrendingUp}
              onClick={handleUpgrade}
            />
          ) : null}

          {isAuthLoading ? (
            <div
              className="sidebar-shell__profile mt-1 flex items-center gap-2 p-2"
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
              <div className="sidebar-shell__profile mt-1 flex items-center gap-2 p-2">
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

              {isAuthenticated ? (
                <div className="sidebar-shell__plan mt-1 flex min-w-0 flex-col gap-1 overflow-hidden px-2.5 py-2">
                  <PlanBadge
                    plan={plan}
                    className="sidebar-shell__plan-badge self-start"
                  />
                  <p className="sidebar-shell__plan-usage truncate text-[10px] text-[var(--text-muted)]">
                    {usageLabel}
                  </p>
                  <p className="truncate text-[10px] capitalize text-[var(--text-muted)]">
                    Subscription: {subscriptionStatus}
                  </p>
                </div>
              ) : null}

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="sidebar-item mt-1"
                  aria-label="Sign out"
                >
                  <LogOut
                    className="h-[15px] w-[15px] shrink-0"
                    strokeWidth={2}
                  />
                  <span className="sidebar-item__label min-w-0 flex-1">
                    Sign out
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="create-assignment-btn mt-1"
                  aria-label="Sign in"
                >
                  <LogIn className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  <span className="create-assignment-btn__label">Sign In</span>
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
