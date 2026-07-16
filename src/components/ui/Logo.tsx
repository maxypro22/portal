import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Steak Town logo — uses the real brand assets from steaktown.qa
 * (bull-horn + ST monogram + "STEAK TOWN" wordmark).
 *   variant="white" → header (dark background)
 *   variant="gold"  → footer / light-on-dark contexts
 * Native asset ratio is 4211×1361 (~3.09:1).
 */
export function Logo({
  className,
  href = "/",
  variant = "white",
  size = "md",
}: {
  className?: string;
  href?: string;
  variant?: "white" | "gold";
  size?: "sm" | "md" | "lg";
}) {
  const height = { sm: 34, md: 44, lg: 64 }[size];
  const width = Math.round(height * 3.094);
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
