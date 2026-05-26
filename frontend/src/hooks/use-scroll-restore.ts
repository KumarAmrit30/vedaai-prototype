"use client";

import { useEffect, useRef } from "react";

export function useScrollRestore(
  containerSelector = ".app-shell__workspace",
  scrollKey = "veda:dashboard-scroll",
): void {
  const restoredRef = useRef(false);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!(container instanceof HTMLElement)) return;

    const saved = sessionStorage.getItem(scrollKey);
    if (saved && !restoredRef.current) {
      container.scrollTop = Number(saved);
      restoredRef.current = true;
    }

    const scrollContainer = container;

    function handleScroll(): void {
      sessionStorage.setItem(scrollKey, String(scrollContainer.scrollTop));
    }

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [containerSelector, scrollKey]);
}
