import type { NavItemId } from "@/components/layout/sidebar";

export const COMING_SOON_TITLE = "Coming Soon";

export const COMING_SOON_MESSAGE =
  "This feature is planned for a future release of ExamForge AI.";

export const COMING_SOON_SUBTITLE = "Stay tuned for ExamForge AI v2.";

export const COMING_SOON_SEARCH_MESSAGE =
  "Global Search is planned for a future release.";

export const COMING_SOON_NAV_IDS: NavItemId[] = ["groups", "library"];

export function isComingSoonNavItem(id: NavItemId): boolean {
  return COMING_SOON_NAV_IDS.includes(id);
}
