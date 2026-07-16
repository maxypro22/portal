import { Phone, Briefcase } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SocialIcons } from "@/components/ui/SocialIcons";
import { BRAND } from "@/lib/constants";

/**
 * Footer mirrors steaktown.qa: warm brown surface, gold logo, "Call us" and
 * "Working hours" columns, tan social buttons, and centered copyright.
 */
export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-surface-border bg-chrome-footer text-content">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr] lg:items-start lg:gap-8">
          {/* Logo */}
          <div>
            <Logo variant="gold" size="lg" />
          </div>

          {/* Call us */}
          <div>
            <h4 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-gold">
              <Phone className="h-5 w-5" />
              Call us
            </h4>
            <ul className="mt-4 space-y-1.5">
              {BRAND.phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="text-content/90 transition-colors hover:text-gold"
                  >
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Working hours + socials */}
          <div>
            <h4 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-gold">
              <Briefcase className="h-5 w-5" />
              Working hours
            </h4>
            <p className="mt-4 text-sm leading-relaxed text-content/90">{BRAND.hoursLine}</p>
            <p className="text-sm leading-relaxed text-content/90">{BRAND.hoursLine2}</p>
            <SocialIcons tone="footer" size="md" className="mt-5" />
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* Copyright */}
        <div className="text-center text-sm text-content/80">
          <p>
            Copyright © 2026 <span className="font-semibold text-content">Steak Town</span> All Rights
            Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
