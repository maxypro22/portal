import { cn } from "@/lib/utils";
import { STATUS_META, type BookingStatus } from "@/lib/constants";

/** Loading skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** Small inline spinner. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin text-current", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z"
      />
    </svg>
  );
}

/** Status pill for bookings. */
export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        meta.badgeClass,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

/** Empty-state block for lists/tables. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-600/60 bg-brand-950/30 px-6 py-14 text-center",
        className
      )}
    >
      {icon && <div className="text-gold/70">{icon}</div>}
      <h3 className="font-serif text-lg text-cream">{title}</h3>
      {description && <p className="max-w-sm text-sm text-cream-dim">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Centered section heading with eyebrow. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="flex items-center gap-2 eyebrow">
          <span className="h-px w-6 bg-gold/60" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif text-3xl font-bold text-cream sm:text-4xl">{title}</h2>
      {description && (
        <p className={cn("max-w-2xl text-cream-dim", align === "center" && "mx-auto")}>
          {description}
        </p>
      )}
    </div>
  );
}

/** Section shape/photo placeholder (branded gradient). */
export function ImagePlaceholder({
  label,
  className,
  icon,
}: {
  label?: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-900 to-brand-950",
        className
      )}
    >
      <div className="absolute inset-0 bg-noise-texture opacity-40" />
      <div className="flex flex-col items-center gap-2 text-cream-dim/70">
        {icon}
        {label && (
          <span className="text-[10px] font-semibold uppercase tracking-luxe">{label}</span>
        )}
      </div>
    </div>
  );
}
