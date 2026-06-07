"use client";

import { useCallback, useRef, useState } from "react";
import {
  COMING_SOON_MESSAGE,
  COMING_SOON_SEARCH_MESSAGE,
} from "@/lib/navigation/coming-soon";

export interface ComingSoonState {
  open: boolean;
  message: string;
  close: () => void;
  show: (message?: string) => void;
  showNotifications: () => void;
  showSearch: () => void;
}

export function useComingSoon(): ComingSoonState {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(COMING_SOON_MESSAGE);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;

    if (target && typeof target.focus === "function") {
      requestAnimationFrame(() => {
        target.focus();
      });
    }
  }, []);

  const show = useCallback((nextMessage = COMING_SOON_MESSAGE) => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setMessage(nextMessage);
    setOpen(true);
  }, []);

  const showNotifications = useCallback(() => {
    show(COMING_SOON_MESSAGE);
  }, [show]);

  const showSearch = useCallback(() => {
    show(COMING_SOON_SEARCH_MESSAGE);
  }, [show]);

  return {
    open,
    message,
    close,
    show,
    showNotifications,
    showSearch,
  };
}
