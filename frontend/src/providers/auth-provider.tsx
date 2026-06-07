"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import {
  clearAuthSessionCookie,
  setAuthSessionCookie,
} from "@/lib/auth/session-cookie";
import { auth } from "@/lib/firebase/client";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthSessionCookie();
        setUser(user);
        setStatus("authenticated");
        void useUserStore.getState().fetchProfile();
        return;
      }

      clearAuthSessionCookie();
      setUser(null);
      setStatus("unauthenticated");
      useUserStore.getState().reset();
    });

    return unsubscribe;
  }, [setStatus, setUser]);

  return <>{children}</>;
}
