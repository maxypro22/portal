import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Staff Login",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
      <div className="absolute inset-0 -z-10 bg-noise-texture opacity-60" />
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 flex justify-center">
          <Logo href="/" variant="white" />
        </div>

        <div className="card p-8 sm:p-10">
          <div className="mb-8 text-center">
            <span className="eyebrow">Staff Portal</span>
            <h1 className="mt-3 font-serif text-2xl font-bold text-cream">Welcome Back</h1>
            <p className="mt-2 text-sm text-cream-dim">
              Sign in to manage reservations and floor plans.
            </p>
          </div>

          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-brand-800/40" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-cream-dim/60">
          Authorized personnel only · Steak Town
        </p>
      </div>
    </div>
  );
}
