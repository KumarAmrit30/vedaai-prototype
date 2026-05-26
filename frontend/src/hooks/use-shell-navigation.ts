"use client";

import { useRouter } from "next/navigation";
import type { NavItemId } from "@/components/layout/sidebar";
import { ROUTES } from "@/lib/navigation/routes";

export function useShellNavigation() {
  const router = useRouter();

  function navigateToCreate(): void {
    router.push(ROUTES.createAssignment);
  }

  function handleNavigate(id: NavItemId): void {
    switch (id) {
      case "dashboard":
        router.push(ROUTES.home);
        break;
      case "assignments":
        router.push(ROUTES.assignments);
        break;
      case "generate":
        router.push(ROUTES.createAssignment);
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
  };
}
