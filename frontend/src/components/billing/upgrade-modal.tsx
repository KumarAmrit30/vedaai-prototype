"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useUserStore } from "@/store/user.store";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Shown when a free-plan user hits the generation limit. The Upgrade action is
 * a placeholder until billing is implemented in a later phase.
 */
export function UpgradeModal() {
  const open = useUserStore((state) => state.upgradeModalOpen);
  const onClose = useUserStore((state) => state.closeUpgradeModal);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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
    toast("Paid plans are coming soon.", { icon: "✨" });
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
              Free Plan Limit Reached
            </h2>
            <p
              id="upgrade-modal-description"
              className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]"
            >
              You&apos;ve used all 3 free assignment generations.
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
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}
