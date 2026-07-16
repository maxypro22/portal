import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Steak Town logo — uses the real brand assets from steaktown.qa
 * (bull-horn + ST monogram + "STEAK TOWN" wordmark).
 *   variant="white" → always white (fixed-dark surfaces, e.g. admin)
 *   variant="gold"  → always gold (footer / light-on-dark contexts)
 *   variant="auto"  → white in dark mode, gold in light mode (default) —
 *                      resolved purely via CSS against the <html data-theme>
 *                      attribute (set synchronously by the no-flash script
 *                      before first paint), so there's no hydration mismatch
 *                      or flash the way a React-state-driven swap would have.
 * Native asset ratio is 4211×1361 (~3.09:1).
 */
export function Logo({
  className,
  href = "/",
  variant = "auto",
  size = "md",
}: {
  className?: string;
  href?: string;
  variant?: "white" | "gold" | "auto";
  size?: "sm" | "md" | "lg";
}) {
  const height = { sm: 34, md: 44, lg: 64 }[size];
  const width = Math.round(height * 3.094);

  if (variant !== "auto") {
    const src = variant === "gold" ? "/logo-gold.png" : "/logo-white.png";
    return (
      <Link
        href={href}
        className={cn("inline-flex select-none items-center transition-opacity hover:opacity-90", className)}
        aria-label="Steak Town — home"
      >
        <Image src={src} alt="Steak Town" width={width} height={height} priority />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn("relative inline-block select-none transition-opacity hover:opacity-90", className)}
      style={{ width, height }}
      aria-label="Steak Town — home"
    >
      <Image
        src="/logo-white.png"
        alt="Steak Town"
        width={width}
        height={height}
        priority
        className="[html[data-theme=light]_&]:hidden"
      />
      <Image
        src="/logo-gold.png"
        alt="Steak Town"
        width={width}
        height={height}
        priority
        className="absolute inset-0 hidden [html[data-theme=light]_&]:block"
      />
    </Link>
  );
}
