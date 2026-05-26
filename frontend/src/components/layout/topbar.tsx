"use client";

import { Bell, Menu, Search } from "lucide-react";

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <>
      {/* Desktop topbar */}
      <header className="hidden md:block">
        <div className="topbar-shell">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--text-secondary)] opacity-70"
              strokeWidth={2}
            />
            <input
              type="search"
              placeholder="Search assignments, groups, library..."
              disabled
              aria-label="Search"
              className="topbar-search placeholder:text-[var(--text-secondary)] placeholder:opacity-70"
            />
          </div>

          <button type="button" aria-label="Notifications" className="topbar-icon-btn">
            <Bell className="h-[16px] w-[16px]" strokeWidth={2} />
          </button>

          <div className="topbar-user-chip">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--black-primary)] text-[10px] font-semibold text-white">
              AK
            </div>
            <span className="hidden text-[13px] font-medium text-[var(--text-primary)] min-[1180px]:inline">
              Amrit Kumar
            </span>
          </div>
        </div>
      </header>

      {/* Mobile topbar */}
      <header className="md:hidden">
        <div className="flex items-center justify-between gap-2 py-0.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--black-primary)] text-[11px] font-bold text-white">
              V
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-none text-[var(--text-primary)]">
                VedaAI
              </p>
              {title ? (
                <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">
                  {subtitle ?? title}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Notifications" className="topbar-icon-btn h-8 w-8">
              <Bell className="h-[15px] w-[15px]" strokeWidth={2} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--black-primary)] text-[10px] font-semibold text-white">
              AK
            </div>
            <button type="button" aria-label="Menu" className="topbar-icon-btn h-8 w-8">
              <Menu className="h-[15px] w-[15px]" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
