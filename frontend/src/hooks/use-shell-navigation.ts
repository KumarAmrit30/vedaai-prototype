"use client";

import { useRouter } from "next/navigation";
import type { NavItemId } from "@/components/layout/sidebar";
import { isComingSoonNavItem } from "@/lib/navigation/coming-soon";
import { ROUTES } from "@/lib/navigation/routes";
import { useComingSoon } from "@/hooks/use-coming-soon";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function useShellNavigation() {
  const router = useRouter();
  const comingSoon = useComingSoon();
  const requireAuth = useRequireAuth();

  function navigateToCreate(): void {
    requireAuth(() => router.push(ROUTES.createAssignment), {
      next: ROUTES.createAssignment,
    });
  }

  function handleNavigate(id: NavItemId): void {
    if (isComingSoonNavItem(id)) {
      comingSoon.show();
      return;
    }

    switch (id) {
      case "dashboard":
        router.push(ROUTES.home);
        break;
      case "assignments":
        router.push(ROUTES.assignments);
        break;
      case "generate":
        requireAuth(() => router.push(ROUTES.createAssignment), {
          next: ROUTES.createAssignment,
        });
        break;
      case "library":
        router.push(ROUTES.library);
        break;
      case "groups":
        router.push(ROUTES.groups);
        break;
      case "settings":
        requireAuth(() => router.push(ROUTES.settings), {
          next: ROUTES.settings,
        });
        break;
      default:
        break;
    }
  }

  function navigateHome(): void {
    router.push(ROUTES.home);
  }

  return {
    navigateToCreate,
    handleNavigate,
    navigateHome,
    comingSoon,
  };
}
