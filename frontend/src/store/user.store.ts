"use client";

import { create } from "zustand";
import apiClient from "@/lib/api/axios";
import { fetchCurrentPlan } from "@/lib/api/billing";
import { useAuthStore } from "@/store/auth.store";
import type { BillingProfile } from "@/types/billing";

export type UserPlan = "free" | "pro" | "enterprise";

export interface UserProfile {
  plan: UserPlan;
  usage: {
    assignmentsGenerated: number;
  };
  limits: {
    /** null means unlimited (pro / enterprise). */
    assignmentsAllowed: number | null;
  };
}

interface ProfileResponse {
  success: boolean;
  data: UserProfile;
}

export type ProfileStatus = "idle" | "loading" | "ready" | "error";

interface UserState {
  profile: UserProfile | null;
  billingProfile: BillingProfile | null;
  status: ProfileStatus;
  upgradeModalOpen: boolean;
  fetchProfile: () => Promise<void>;
  fetchBillingProfile: () => Promise<void>;
  reset: () => void;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  billingProfile: null,
  status: "idle",
  upgradeModalOpen: false,

  fetchProfile: async () => {
    const authStatus = useAuthStore.getState().status;
    if (authStatus !== "authenticated") return;

    const token = await useAuthStore.getState().getIdToken();
    if (!token) return;

    set({ status: "loading" });
    try {
      const response = await apiClient.get<ProfileResponse>("/users/me");
      set({ profile: response.data.data, status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  fetchBillingProfile: async () => {
    const authStatus = useAuthStore.getState().status;
    if (authStatus !== "authenticated") return;

    const token = await useAuthStore.getState().getIdToken();
    if (!token) return;

    try {
      const billingProfile = await fetchCurrentPlan();
      set({ billingProfile });
    } catch {
      // Billing profile is supplementary; keep existing profile state.
    }
  },

  reset: () =>
    set({
      profile: null,
      billingProfile: null,
      status: "idle",
      upgradeModalOpen: false,
    }),

  openUpgradeModal: () => set({ upgradeModalOpen: true }),

  closeUpgradeModal: () => set({ upgradeModalOpen: false }),
}));
