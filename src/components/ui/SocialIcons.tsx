import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

/* Brand SVG glyphs (lucide dropped brand icons, so we inline them). */

function Snapchat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2c2.3 0 4.2 1.7 4.4 4l.1 2.1c.5.3 1 .2 1.6-.1.6-.3 1.3.5.9 1.1-.3.5-1 .8-1.6 1-.3.1-.5.2-.5.5.1.9 1.2 2.4 2.7 3 .5.2.4.9-.1 1-.4.1-.8.1-1 .5-.1.3 0 .6-.4.7-.5.2-1.1 0-1.7.1-.5.1-.7.6-1.2.9-.7.4-1.7.5-2.6.2-.5-.2-1-.5-1.6-.5s-1.1.3-1.6.5c-.9.3-1.9.2-2.6-.2-.5-.3-.7-.8-1.2-.9-.6-.1-1.2.1-1.7-.1-.4-.1-.3-.4-.4-.7-.2-.4-.6-.4-1-.5-.5-.1-.6-.8-.1-1 1.5-.6 2.6-2.1 2.7-3 0-.3-.2-.4-.5-.5-.6-.2-1.3-.5-1.6-1-.4-.6.3-1.4.9-1.1.6.3 1.1.4 1.6.1L7.6 6C7.8 3.7 9.7 2 12 2Z" />
    </svg>
  );
}
function TikTok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.5 3c.3 2 1.5 3.4 3.5 3.7v2.6c-1.3.1-2.5-.3-3.5-1v6.1c0 3.3-2.4 5.6-5.5 5.6A5.4 5.4 0 0 1 5.5 14c0-3 2.3-5.3 5.4-5.3.3 0 .6 0 .9.1v2.8a3 3 0 0 0-1-.2 2.6 2.6 0 0 0-2.5 2.6c0 1.5 1.1 2.6 2.6 2.6s2.6-1.1 2.6-2.8V3h3Z" />
    </svg>
  );
}
function Instagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function Facebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M14 9V7c0-.9.6-1 1-1h2V3h-3c-2.2 0-3 1.6-3 3.4V9H9v3h2v9h3v-9h2.2l.6-3H14Z" />
    </svg>
  );
}

const SOCIALS = [
  { key: "snapchat", label: "Snapchat", Icon: Snapchat, href: BRAND.socials.snapchat },
  { key: "tiktok", label: "TikTok", Icon: TikTok, href: BRAND.socials.tiktok },
  { key: "instagram", label: "Instagram", Icon: Instagram, href: BRAND.socials.instagram },
  { key: "facebook", label: "Facebook", Icon: Facebook, href: BRAND.socials.facebook },
] as const;

/**
 * tone:
 *  - "default" → dark brand card (used on light-content pages)
 *  - "dark"    → circular icons for the near-black header
 *  - "footer"  → tan rounded-square buttons for the brown footer
 */
export function SocialIcons({
  className,
  size = "sm",
  tone = "default",
}: {
  className?: string;
  size?: "sm" | "md";
  tone?: "default" | "dark" | "footer";
}) {
  const box = size === "md" ? "h-10 w-10" : "h-9 w-9";
  const icon = size === "md" ? "h-[18px] w-[18px]" : "h-4 w-4";

  const shapeClass =
    tone === "footer"
      ? "rounded-lg border border-surface-border bg-surface-sunken text-content hover:border-gold hover:bg-gold hover:text-ink"
      : tone === "dark"
        ? "rounded-full border border-content/25 bg-content/5 text-content hover:border-gold hover:bg-gold hover:text-ink"
        : "rounded-full border border-brand-600/60 bg-brand-950/40 text-cream-muted hover:border-gold hover:text-gold";

  return (
    <ul className={cn("flex items-center gap-2.5", className)}>
      {SOCIALS.map(({ key, label, Icon, href }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={cn(
              "grid place-items-center transition-all duration-300 hover:-translate-y-0.5",
              box,
              shapeClass
            )}
          >
            <Icon className={icon} />
          </a>
        </li>
      ))}
    </ul>
  );
}
