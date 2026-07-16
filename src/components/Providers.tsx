"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

/**
 * Client-side providers mounted once at the app root:
 *  - NextAuth session context
 *  - Brand-styled toast notifications
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#241d1d",
            color: "#f5efe6",
            border: "1px solid rgba(224,179,87,0.35)",
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "14px",
            boxShadow: "0 10px 40px -20px rgba(0,0,0,0.8)",
          },
          success: { iconTheme: { primary: "#e0b357", secondary: "#241d1d" } },
          error: { iconTheme: { primary: "#c0563f", secondary: "#241d1d" } },
        }}
      />
    </SessionProvider>
  );
}
