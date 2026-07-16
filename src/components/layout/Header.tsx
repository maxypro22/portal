"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SocialIcons } from "@/components/ui/SocialIcons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "Contact us", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-surface-border bg-chrome-header/95 backdrop-blur-md shadow-card"
          : "bg-gradient-to-b from-chrome-header via-chrome-header/85 to-transparent"
      )}
    >
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo size="md" />

        {/* Desktop nav — centered in the bar */}
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative text-sm font-medium tracking-wide transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-gold after:transition-all after:duration-300",
                isActive(item.href)
                  ? "text-content after:w-full"
                  : "text-content-muted hover:text-content after:w-0 hover:after:w-full"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right cluster: socials + theme toggle + Book a Table, العربية below */}
        <div className="hidden flex-col items-end gap-2.5 lg:flex">
          <div className="flex items-center gap-4">
            <SocialIcons tone="dark" />
            <ThemeToggle />
            <Link href="/book" className="btn-gold px-5 py-2 text-sm">
              Book a Table
            </Link>
          </div>
          <a
            href="/"
            lang="ar"
            dir="rtl"
            className="flex items-center gap-1.5 text-sm font-medium text-content-muted transition-colors hover:text-gold"
            title="العربية"
          >
            <Globe className="h-4 w-4" />
            العربية
          </a>
        </div>

        {/* Mobile: theme toggle + menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-full border border-surface-border-strong text-content"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-surface-border bg-chrome-header/98 backdrop-blur-md transition-[max-height] duration-500 lg:hidden",
          open ? "max-h-[26rem]" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-6 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-3 text-base font-medium transition-colors",
                isActive(item.href)
                  ? "bg-gold/15 text-gold"
                  : "text-content-muted hover:bg-surface-sunken hover:text-content"
              )}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="/"
            lang="ar"
            dir="rtl"
            className="rounded-lg px-3 py-3 text-base font-medium text-content-muted hover:bg-surface-sunken hover:text-content"
          >
            العربية
          </a>
          <Link href="/book" className="btn-gold mt-3 w-full">
            Book a Table
          </Link>
          <div className="mt-4 flex justify-center pb-2">
            <SocialIcons tone="dark" />
          </div>
        </nav>
      </div>
    </header>
  );
}
