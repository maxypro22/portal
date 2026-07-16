"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Mail, Lock, Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";

  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@steaktown.qa", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });
      if (res?.error) {
        // NextAuth returns "CredentialsSignin" when authorize() returns null
        // (wrong email/password) vs. "Configuration" when authorize() threw
        // (e.g. the app couldn't reach the database) — surface which one so
        // this doesn't look like a password problem when it's actually a
        // server/DB problem.
        toast.error(
          res.error === "CredentialsSignin"
            ? "Invalid email or password"
            : `Sign-in failed: ${res.error}. This usually means the server can't reach the database — check DATABASE_URL / DIRECT_URL and Vercel's runtime logs.`
        );
      } else {
        toast.success("Signed in");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-muted">
          <Mail className="h-4 w-4 text-gold/70" /> Email
        </span>
        <input
          type="email"
          {...register("email")}
          className="input-base"
          placeholder="admin@steaktown.qa"
          autoComplete="username"
        />
        {errors.email && (
          <span className="mt-1 block text-xs text-status-cancelled">{errors.email.message}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-muted">
          <Lock className="h-4 w-4 text-gold/70" /> Password
        </span>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            {...register("password")}
            className="input-base pr-11"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-dim hover:text-gold"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <span className="mt-1 block text-xs text-status-cancelled">
            {errors.password.message}
          </span>
        )}
      </label>

      <button type="submit" disabled={loading} className="btn-gold w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" /> Sign In
          </>
        )}
      </button>

      <p className="rounded-lg border border-brand-600/40 bg-brand-950/40 px-3 py-2.5 text-center text-xs text-cream-dim">
        Demo credentials · <span className="text-gold">admin@steaktown.qa</span> / Admin@1234
      </p>
    </form>
  );
}
