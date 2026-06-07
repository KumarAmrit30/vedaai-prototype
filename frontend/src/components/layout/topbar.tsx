"use client";

import type { KeyboardEvent } from "react";
import { Bell, LogIn, Menu, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import {
  getUserDisplayName,
  getUserInitials,
} from "@/lib/auth/user-display";
import { useAuthStore } from "@/store/auth.store";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onNotificationsClick?: () => void;
  onSearchInteract?: () => void;
}

function UserAvatar({
  photoURL,
  initials,
  className,
}: {
  photoURL?: string | null;
  initials: string;
  className: string;
}): React.ReactNode {
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt=""
        className={`${className} object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center bg-[var(--black-primary)] text-[10px] font-semibold text-white`}
    >
      {initials}
    </div>
  );
}

export function Topbar({
  title,
  subtitle,
  onNotificationsClick,
  onSearchInteract,
}: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isAuthLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && Boolean(user);
  const displayName = isAuthenticated && user ? getUserDisplayName(user) : "Guest User";
  const initials = isAuthenticated && user ? getUserInitials(user) : "GU";

  function handleSignIn(): void {
    const next = encodeURIComponent(pathname ?? "/");
    router.push(`/login?next=${next}`);
  }

  function handleSearchInteract(): void {
    onSearchInteract?.();
  }

  function handleNotificationsClick(): void {
    onNotificationsClick?.();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Escape") return;
    event.preventDefault();
    handleSearchInteract();
  }

  return (
    <>
      {/* Desktop topbar */}
      <header className="hidden md:block">
        <div className="topbar-shell">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--text-secondary)] opacity-70"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              type="search"
              readOnly
              placeholder="Search assignments, groups, library..."
              aria-label="Global search (coming soon)"
              aria-describedby="topbar-search-hint"
              className="topbar-search topbar-search--coming-soon cursor-pointer placeholder:text-[var(--text-secondary)] placeholder:opacity-70"
              onFocus={handleSearchInteract}
              onClick={handleSearchInteract}
              onKeyDown={handleSearchKeyDown}
            />
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              <ComingSoonBadge compact />
            </span>
            <span id="topbar-search-hint" className="sr-only">
              Global Search is planned for a future release.
            </span>
          </div>

          <button
            type="button"
            aria-label="Notifications (coming soon)"
            className="topbar-icon-btn relative"
            onClick={handleNotificationsClick}
          >
            <Bell className="h-[16px] w-[16px]" strokeWidth={2} />
          </button>

          {isAuthLoading ? (
            <div className="topbar-user-chip" aria-hidden="true">
              <div className="shimmer-block h-7 w-7 rounded-full" />
              <div className="hidden shimmer-block h-3.5 w-20 min-[1180px]:block" />
            </div>
          ) : isAuthenticated ? (
            <div className="topbar-user-chip">
              <UserAvatar
                photoURL={user?.photoURL}
                initials={initials}
                className="h-7 w-7 rounded-full"
              />
              <span className="hidden text-[13px] font-medium text-[var(--text-primary)] min-[1180px]:inline">
                {displayName}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              className="submit-pill-btn"
              aria-label="Sign in"
            >
              <LogIn className="h-3.5 w-3.5" strokeWidth={2.5} />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Mobile topbar */}
      <header className="md:hidden">
        <div className="flex items-center justify-between gap-2 py-0.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--black-primary)] text-[11px] font-bold text-white">
              E
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-none text-[var(--text-primary)]">
                ExamForge AI
              </p>
              {title ? (
                <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">
                  {subtitle ?? title}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Global search (coming soon)"
              className="topbar-icon-btn h-8 w-8"
              onClick={handleSearchInteract}
            >
              <Search className="h-[15px] w-[15px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Notifications (coming soon)"
              className="topbar-icon-btn h-8 w-8"
              onClick={handleNotificationsClick}
            >
              <Bell className="h-[15px] w-[15px]" strokeWidth={2} />
            </button>
            {isAuthLoading ? (
              <div
                className="shimmer-block h-8 w-8 rounded-full"
                aria-hidden="true"
              />
            ) : isAuthenticated ? (
              <UserAvatar
                photoURL={user?.photoURL}
                initials={initials}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                aria-label="Sign in"
                className="topbar-icon-btn h-8 w-8"
              >
                <LogIn className="h-[15px] w-[15px]" strokeWidth={2} />
              </button>
            )}
            <button type="button" aria-label="Menu" className="topbar-icon-btn h-8 w-8">
              <Menu className="h-[15px] w-[15px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
