"use client";

import {
  AppWindow,
  CreditCard,
  Loader2,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  SettingsDetailRow,
  SettingsSection,
} from "@/components/settings/settings-section";
import { PlanBadge } from "@/components/ui/plan-badge";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useShellNavigation } from "@/hooks/use-shell-navigation";
import {
  APP_NAME,
  APP_VERSION,
  getAppEnvironment,
} from "@/lib/app-metadata";
import { getFirebaseProviderLabel } from "@/lib/auth/provider-label";
import {
  getUserDisplayName,
  getUserInitials,
} from "@/lib/auth/user-display";
import { ROUTES } from "@/lib/navigation/routes";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";

export default function SettingsPage() {
  const router = useRouter();
  const { handleNavigate, navigateToCreate, comingSoon } = useShellNavigation();
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const requireAuth = useRequireAuth();

  const profile = useUserStore((state) => state.profile);
  const billingProfile = useUserStore((state) => state.billingProfile);
  const profileStatus = useUserStore((state) => state.status);
  const fetchProfile = useUserStore((state) => state.fetchProfile);
  const fetchBillingProfile = useUserStore((state) => state.fetchBillingProfile);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      requireAuth(undefined, { next: ROUTES.settings });
    }
  }, [authStatus, requireAuth]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    void fetchProfile();
    void fetchBillingProfile();
  }, [authStatus, fetchProfile, fetchBillingProfile]);

  const plan = billingProfile?.plan ?? profile?.plan ?? "free";
  const subscriptionStatus =
    billingProfile?.subscription.status ?? "inactive";
  const generationsUsed =
    billingProfile?.usage.assignmentsGenerated ??
    profile?.usage.assignmentsGenerated ??
    0;
  const generationsAllowed =
    billingProfile?.limits.assignmentsAllowed ??
    profile?.limits.assignmentsAllowed ??
    null;
  const usageLabel =
    generationsAllowed === null
      ? String(generationsUsed)
      : `${generationsUsed} / ${generationsAllowed}`;

  const isLoading = authStatus === "loading" || profileStatus === "loading";

  async function handleSignOut(): Promise<void> {
    await signOut();
    useUserStore.getState().reset();
    router.replace("/");
  }

  return (
    <AppShell
      title="Settings"
      subtitle="Account, subscription, and application preferences"
      activeNav="settings"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
        {isLoading || !user ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <SettingsSection
              title="Account"
              description="Your signed-in profile from Firebase Authentication."
              icon={UserRound}
            >
              <div className="mb-5 flex items-center gap-4">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--orange-primary)] text-sm font-bold text-[var(--black-primary)]">
                    {getUserInitials(user)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-[var(--text-primary)]">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="truncate text-[13px] text-[var(--text-secondary)]">
                    {user.email ?? "No email on file"}
                  </p>
                </div>
              </div>

              <dl>
                <SettingsDetailRow
                  label="Display name"
                  value={getUserDisplayName(user)}
                />
                <SettingsDetailRow
                  label="Email"
                  value={user.email ?? "—"}
                />
                <SettingsDetailRow
                  label="Sign-in provider"
                  value={getFirebaseProviderLabel(user)}
                />
              </dl>
            </SettingsSection>

            <SettingsSection
              title="Subscription"
              description="Your current plan and generation usage."
              icon={CreditCard}
            >
              <div className="mb-4">
                <PlanBadge plan={plan} />
              </div>

              <dl>
                <SettingsDetailRow
                  label="Current plan"
                  value={<span className="capitalize">{plan}</span>}
                />
                <SettingsDetailRow
                  label="Subscription status"
                  value={
                    <span className="capitalize">{subscriptionStatus}</span>
                  }
                />
                <SettingsDetailRow
                  label="Assignments generated"
                  value={String(generationsUsed)}
                />
                <SettingsDetailRow
                  label="Assignment limit"
                  value={
                    generationsAllowed === null
                      ? "Unlimited"
                      : String(generationsAllowed)
                  }
                />
                <SettingsDetailRow
                  label="Usage"
                  value={usageLabel}
                />
              </dl>

              <button
                type="button"
                onClick={() => router.push(ROUTES.upgrade)}
                className="submit-pill-btn mt-5 w-full sm:w-auto"
              >
                Upgrade Plan
              </button>
            </SettingsSection>

            <SettingsSection
              title="Application"
              description="Build and runtime information for this workspace."
              icon={AppWindow}
            >
              <dl>
                <SettingsDetailRow label="App name" value={APP_NAME} />
                <SettingsDetailRow label="Version" value={`v${APP_VERSION}`} />
                <SettingsDetailRow
                  label="Environment"
                  value={
                    <span className="capitalize">{getAppEnvironment()}</span>
                  }
                />
              </dl>
            </SettingsSection>

            <SettingsSection
              title="Security"
              description="Manage your session on this device."
              icon={Shield}
            >
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="outline-pill-btn inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                Sign Out
              </button>
            </SettingsSection>
          </div>
        )}
      </div>
    </AppShell>
  );
}
