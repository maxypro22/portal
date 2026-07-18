import { cn } from "@/lib/utils";

/** Admin page header with title, subtitle, and optional action slot. */
export function PageHeader({
  title,
  subtitle,
  badge,
  action,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-bold text-content">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1 text-sm text-content-dim">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** KPI stat card. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "gold",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "gold" | "green" | "amber" | "purple";
}) {
  const accentClass = {
    gold: "text-gold bg-gold/10 border-gold/30",
    green: "text-status-confirmed bg-emerald-500/10 border-status-confirmed/30",
    amber: "text-status-pending bg-amber-500/10 border-status-pending/30",
    purple: "text-status-noshow bg-purple-500/10 border-status-noshow/30",
  }[accent];

  return (
    <div className="card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-content-dim">{label}</p>
          <p className="mt-2 font-serif text-3xl font-bold text-content">{value}</p>
          {hint && <p className="mt-1 text-xs text-content-dim/70">{hint}</p>}
        </div>
        {icon && (
          <span className={cn("grid h-11 w-11 place-items-center rounded-xl border", accentClass)}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
