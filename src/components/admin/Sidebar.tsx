"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Clock,
  MapPin,
  UserCog,
  Mail,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Working Hours", href: "/admin/hours", icon: Clock },
  { label: "Locations", href: "/admin/locations", icon: MapPin },
  { label: "Users", href: "/admin/users", icon: UserCog },
  { label: "Send Emails", href: "/admin/emails", icon: Mail },
];

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const NavList = () => (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all",
            isActive(href)
              ? "bg-gold/10 text-gold shadow-[inset_2px_0_0_0_#c9a227]"
              : "text-content-muted hover:bg-surface-sunken hover:text-content"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </Link>
      ))}
    </nav>
  );

  const Footer = () => (
    <div className="mt-auto space-y-1 border-t border-surface-border px-3 py-4">
      <div className="flex items-center justify-between px-3.5 py-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-content-dim">Theme</span>
        <ThemeToggle />
      </div>
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
      >
        <ExternalLink className="h-[18px] w-[18px]" />
        View Site
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-content-muted transition-colors hover:bg-status-cancelled/10 hover:text-status-cancelled"
      >
        <LogOut className="h-[18px] w-[18px]" />
        Sign Out
      </button>
      {userName && (
        <p className="px-3.5 pt-2 text-xs text-content-dim/70">
          Signed in as <span className="text-content-muted">{userName}</span>
        </p>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-surface-border bg-surface-raised/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-lg border border-surface-border-strong text-content"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-surface-border bg-surface-raised/60 py-6 lg:flex">
        <div className="px-5 pb-6">
          <Logo size="sm" />
        </div>
        <NavList />
        <Footer />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-surface-raised py-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between px-5 pb-6">
              <Logo size="sm" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg border border-surface-border-strong text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList />
            <Footer />
          </div>
        </div>
      )}
    </>
  );
}
