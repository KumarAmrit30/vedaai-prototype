"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PlanCard } from "@/components/billing/plan-card";
import { AppShell } from "@/components/layout/app-shell";
import { fetchPlanCatalog } from "@/lib/api/billing";
import { useShellNavigation } from "@/hooks/use-shell-navigation";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";
import type { Plan } from "@/types/billing";

export default function UpgradePage() {
  const { handleNavigate, navigateToCreate, comingSoon } = useShellNavigation();
  const authStatus = useAuthStore((state) => state.status);
  const billingProfile = useUserStore((state) => state.billingProfile);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const catalog = await fetchPlanCatalog();
        if (!cancelled) {
          setPlans(catalog);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load plans. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlan = billingProfile?.plan ?? "free";
  const subscriptionStatus = billingProfile?.subscription.status ?? "inactive";

  return (
    <AppShell
      title="Upgrade"
      subtitle="Choose a plan for your workspace"
      activeNav="dashboard"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Plans & Pricing
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Paid plans are not available yet. All users remain on the free plan
            while we prepare checkout and subscription management.
          </p>
          {authStatus === "authenticated" ? (
            <p className="mt-3 text-[13px] text-[var(--text-muted)]">
              Current plan:{" "}
              <span className="font-medium text-[var(--text-secondary)]">
                {currentPlan}
              </span>
              {" · "}
              Subscription:{" "}
              <span className="font-medium capitalize text-[var(--text-secondary)]">
                {subscriptionStatus}
              </span>
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : null}

        {error ? (
          <div className="product-state-card surface-card-compact px-6 py-8 text-center">
            <p className="text-[14px] text-[var(--text-secondary)]">{error}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={authStatus === "authenticated" && plan.id === currentPlan}
                highlight={plan.id === "pro"}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
