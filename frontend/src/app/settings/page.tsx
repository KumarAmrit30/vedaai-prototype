"use client";

import {
  CreditCard,
  Loader2,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { GenerationPreferencesSection } from "@/components/settings/generation-preferences-section";
import { WorkspacePreferencesSection } from "@/components/settings/workspace-preferences-section";
import {
  SettingsDetailRow,
  SettingsSection,
} from "@/components/settings/settings-section";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
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

type SettingsSectionId =
  | "profile"
  | "appearance"
  | "generation"
  | "workspace"
  | "notifications"
  | "security"
  | "billing"
  | "about";

const NAV_ITEMS: { id: SettingsSectionId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "generation", label: "Generation" },
  { id: "workspace", label: "Workspace" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "billing", label: "Billing" },
  { id: "about", label: "About" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { handleNavigate, navigateToCreate, comingSoon } = useShellNavigation();
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const requireAuth = useRequireAuth();
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("profile");

  const profile = useUserStore((state) => state.profile);
  const billingProfile = useUserStore((state) => state.billingProfile);
  const profileStatus = useUserStore((state) => state.status);
  const fetchProfile = useUserStore((state) => state.fetchProfile);
  const fetchBillingProfile = useUserStore(
    (state) => state.fetchBillingProfile,
  );

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

  function renderSection(): React.ReactNode {
    if (isLoading || !user) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
        </div>
      );
    }

    switch (activeSection) {
      case "profile":
        return (
          <SettingsSection
            title="Profile"
            description="Your signed-in educator profile."
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
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-sm font-bold text-white">
                  {getUserInitials(user)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-[18px] font-semibold text-[var(--text-primary)]">
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
              <SettingsDetailRow label="Email" value={user.email ?? "—"} />
              <SettingsDetailRow
                label="Sign-in provider"
                value={getFirebaseProviderLabel(user)}
              />
            </dl>
          </SettingsSection>
        );
      case "appearance":
        return <AppearanceSection />;
      case "generation":
        return <GenerationPreferencesSection />;
      case "workspace":
        return <WorkspacePreferencesSection />;
      case "notifications":
        return (
          <SettingsSection
            title="Notifications"
            description="Email and in-app alerts for your workspace."
            icon={Shield}
          >
            <div className="mb-4 flex items-center gap-2">
              <ComingSoonBadge />
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Email and in-app alerts are not available yet. The toggles below
              show planned notification types only.
            </p>
            {[
              "Paper generated",
              "Ready for export",
              "Usage limit reached",
              "Product updates",
            ].map((label) => (
              <div key={label} className="settings-toggle-row opacity-60">
                <span className="text-[13px] text-[var(--text-primary)]">
                  {label}
                </span>
                <div className="settings-toggle" aria-hidden="true" />
              </div>
            ))}
          </SettingsSection>
        );
      case "security":
        return (
          <SettingsSection
            title="Security"
            description="Firebase account and session management."
            icon={Shield}
          >
            <dl>
              <SettingsDetailRow
                label="Account"
                value="Firebase Authentication"
              />
              <SettingsDetailRow label="Email" value={user.email ?? "—"} />
              <SettingsDetailRow
                label="Provider"
                value={getFirebaseProviderLabel(user)}
              />
              <SettingsDetailRow
                label="Sessions"
                value="Managed by Firebase"
              />
              <SettingsDetailRow
                label="Password"
                value="Managed by your sign-in provider"
              />
            </dl>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="outline-pill-btn mt-5 inline-flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Sign Out
            </button>
          </SettingsSection>
        );
      case "billing":
        return (
          <SettingsSection
            title="Billing"
            description="Plan, usage, and subscription details."
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
                value={<span className="capitalize">{subscriptionStatus}</span>}
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
              <SettingsDetailRow label="Usage" value={usageLabel} />
            </dl>
            <button
              type="button"
              onClick={() => router.push(ROUTES.upgrade)}
              className="submit-pill-btn mt-5"
            >
              Upgrade Plan
            </button>
          </SettingsSection>
        );
      case "about":
        return (
          <SettingsSection
            title="About"
            description="Application information."
            icon={Shield}
          >
            <dl>
              <SettingsDetailRow label="App name" value={APP_NAME} />
              <SettingsDetailRow label="Version" value={`v${APP_VERSION}`} />
              <SettingsDetailRow
                label="Environment"
                value={<span className="capitalize">{getAppEnvironment()}</span>}
              />
            </dl>
          </SettingsSection>
        );
      default:
        return null;
    }
  }

  return (
    <AppShell
      title="Settings"
      subtitle="Account, appearance, and workspace preferences"
      activeNav="settings"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`settings-nav__item${
                activeSection === item.id ? " settings-nav__item--active" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="settings-panel">{renderSection()}</div>
      </div>
    </AppShell>
  );
}
