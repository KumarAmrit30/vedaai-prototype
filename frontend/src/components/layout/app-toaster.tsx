"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      gutter={10}
      containerClassName="app-toaster"
      toastOptions={{
        duration: 3200,
        className: "app-toast",
        style: {
          background: "var(--surface-elevated)",
          color: "var(--text-primary)",
          fontSize: "13px",
        },
        success: {
          iconTheme: {
            primary: "var(--orange-primary)",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--danger)",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
