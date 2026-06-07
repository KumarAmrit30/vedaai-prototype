"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  COMING_SOON_SUBTITLE,
  COMING_SOON_TITLE,
} from "@/lib/navigation/coming-soon";

interface ComingSoonDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ComingSoonDialog({
  open,
  message,
  onClose,
}: ComingSoonDialogProps) {
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

  return (
    <div className="confirm-dialog" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="confirm-dialog__panel surface-card-compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-dialog-title"
        aria-describedby="coming-soon-dialog-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border-light)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
            <Clock3 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="coming-soon-dialog-title"
              className="text-[15px] font-semibold text-[var(--text-primary)]"
            >
              {COMING_SOON_TITLE}
            </h2>
            <p
              id="coming-soon-dialog-description"
              className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]"
            >
              {message}
            </p>
            <p className="mt-2 text-[12px] text-[var(--text-muted)]">
              {COMING_SOON_SUBTITLE}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="submit-pill-btn"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
