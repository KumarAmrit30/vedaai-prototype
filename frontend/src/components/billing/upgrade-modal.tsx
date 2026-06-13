"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ROUTES } from "@/lib/navigation/routes";
import { useUserStore } from "@/store/user.store";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function formatLimitMessage(
  used: number,
  limit: number | null | undefined,
): string {
  if (limit == null) {
    return `You have used ${used} assignment generation${used === 1 ? "" : "s"} on your current plan.`;
  }

  return `You have used ${used} of ${limit} assignment generation${limit === 1 ? "" : "s"} included in your plan.`;
}

/**
 * Shown when a free-plan user hits the generation limit. The Upgrade action is
 * a placeholder until billing is implemented in a later phase.
 */
export function UpgradeModal() {
  const router = useRouter();
  const open = useUserStore((state) => state.upgradeModalOpen);
  const onClose = useUserStore((state) => state.closeUpgradeModal);
  const billingProfile = useUserStore((state) => state.billingProfile);
  const profile = useUserStore((state) => state.profile);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const generationsUsed =
    billingProfile?.usage.assignmentsGenerated ??
    profile?.usage.assignmentsGenerated ??
    0;
  const assignmentLimit =
    billingProfile?.limits.assignmentsAllowed ??
    profile?.limits.assignmentsAllowed;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleUpgrade(): void {
    onClose();
    router.push(ROUTES.upgrade);
  }

  return (
    <div className="confirm-dialog" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="confirm-dialog__panel surface-card-compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        aria-describedby="upgrade-modal-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border-light)] bg-[var(--surface-muted)] text-[var(--orange-primary)]">
            <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="upgrade-modal-title"
              className="text-[15px] font-semibold text-[var(--text-primary)]"
            >
              Plan Limit Reached
            </h2>
            <p
              id="upgrade-modal-description"
              className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]"
            >
              {formatLimitMessage(generationsUsed, assignmentLimit)}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="outline-pill-btn w-full sm:w-auto"
          >
            Maybe Later
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            className="submit-pill-btn w-full sm:w-auto"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}
