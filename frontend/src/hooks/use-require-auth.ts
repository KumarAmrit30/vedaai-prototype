"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";

interface RequireAuthOptions {
  /** Route to return to after login. Defaults to the current path. */
  next?: string;
}

/**
 * Auth-on-action guard.
 * - Authenticated: runs the callback (if provided) and returns true.
 * - Not authenticated: redirects to /login?next=<target> and returns false.
 */
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);

  return useCallback(
    (callback?: () => void, options?: RequireAuthOptions): boolean => {
      if (status === "authenticated") {
        callback?.();
        return true;
      }

      const target = options?.next ?? pathname ?? "/";
      router.push(`/login?next=${encodeURIComponent(target)}`);
      return false;
    },
    [router, pathname, status],
  );
}
