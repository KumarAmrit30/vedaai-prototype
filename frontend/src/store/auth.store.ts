"use client";

import {
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { create } from "zustand";
import {
  clearAuthSessionCookie,
  setAuthSessionCookie,
} from "@/lib/auth/session-cookie";
import { auth, googleProvider } from "@/lib/firebase/client";
import { disconnectSocket } from "@/lib/socket/client";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "loading",

  setUser: (user) => set({ user }),

  setStatus: (status) => set({ status }),

  signInWithGoogle: async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    setAuthSessionCookie();
    set({
      user: credential.user,
      status: "authenticated",
    });
  },

  signOut: async () => {
    disconnectSocket();
    clearAuthSessionCookie();
    await firebaseSignOut(auth);
    set({
      user: null,
      status: "unauthenticated",
    });
  },

  getIdToken: async () => {
    const { user: storeUser } = get();
    const user = storeUser ?? auth.currentUser;

    if (!user) return null;

    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  },
}));
