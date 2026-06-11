"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import {
  clearAuthSessionCookie,
  setAuthSessionCookie,
} from "@/lib/auth/session-cookie";
import { auth } from "@/lib/firebase/client";
import { useAssignmentStore } from "@/store/assignment.store";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";

function resetAssignmentWorkspace(): void {
  const assignmentStore = useAssignmentStore.getState();
  assignmentStore.setAssignments([]);
  assignmentStore.setLoadedOnce(false);
  assignmentStore.setLoading(false);
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const previousUid = useAuthStore.getState().user?.uid;

        if (previousUid && previousUid !== user.uid) {
          resetAssignmentWorkspace();
          useUserStore.getState().reset();
        }

        setAuthSessionCookie();
        setUser(user);
        setStatus("authenticated");

        // Wait for a valid ID token before calling protected APIs.
        void (async () => {
          const token = await user.getIdToken();
          if (!token) return;
          const userStore = useUserStore.getState();
          await userStore.fetchProfile();
          await userStore.fetchBillingProfile();
        })();

        return;
      }

      clearAuthSessionCookie();
      setUser(null);
      setStatus("unauthenticated");
      resetAssignmentWorkspace();
      useUserStore.getState().reset();
    });

    return unsubscribe;
  }, [setStatus, setUser]);

  return <>{children}</>;
}
