import Link from "next/link";
import { CalendarCheck, Users, Clock, BellRing } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/admin/AdminUI";
import { AdminChart, type ChartPoint } from "@/components/admin/AdminChart";
import { StatusBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Primitives";
import { cn, formatTime12h, toDateKey } from "@/lib/utils";
import type { BookingStatus } from "@/lib/constants";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic"; // always fresh dashboard data

const ACTIVE: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"];
const CHART_DAYS_BEFORE = 5;
const CHART_DAYS_AFTER = 5;
// Defensive cap — a single day's timeline list should never need to render
// more rows than this; protects the page from an unbounded scan/render if a
// single day ever received an unusually large number of bookings.
const TIMELINE_LIMIT = 200;

const PERIODS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "month", label: "Month" },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Date range for the selected stat-card period. `start`/`end` are both null
 * for "all" — the queries below treat that as "no date filter," i.e. the
 * all-time total.
 */
function getPeriodRange(period: PeriodKey, today: Date) {
  if (period === "today") return { start: today, end: today, label: "today" };
  if (period === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start, end, label: "this month" };
  }
  return { start: null as Date | null, end: null as Date | null, label: "all time" };
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const period: PeriodKey = PERIODS.some((p) => p.key === searchParams.period)
    ? (searchParams.period as PeriodKey)
    : "all";
  const { start, end, label: periodLabel } = getPeriodRange(period, today);
  const periodDateFilter = start && end ? { date: { gte: start, lte: end } } : {};

  const chartStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - CHART_DAYS_BEFORE
  );
  const chartEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + CHART_DAYS_AFTER
  );

  // --- Parallel data fetch ---
  // periodStats uses a DB-level aggregate (not findMany + JS reduce) so it
  // stays fast for the "All" filter even once bookings run into the
  // hundreds of thousands — Postgres computes count/sum, only two numbers
  // cross the wire instead of every row.
  const [periodStats, todayCreatedCount, chartRows, todaysTimeline] = await Promise.all([
    prisma.booking.aggregate({
      where: { ...periodDateFilter, status: { in: ACTIVE } },
      _count: { _all: true },
      _sum: { partySize: true },
    }),
    // Bookings *placed* today (by createdAt), independent of the period
    // filter and of which date they're for — resets naturally every day
    // since `today`/`tomorrow` are recomputed on every server render.
    prisma.booking.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.booking.findMany({
      where: {
        date: { gte: chartStart, lte: chartEnd },
        status: { in: ACTIVE },
      },
      select: { date: true },
    }),
    prisma.booking.findMany({
      where: { date: today },
      orderBy: { timeSlot: "asc" },
      take: TIMELINE_LIMIT,
      include: {
        location: { select: { name: true } },
      },
    }),
  ]);

  const totalGuests = periodStats._sum.partySize ?? 0;

  // Build chart buckets: 5 days before today through 5 days after today.
  const buckets = new Map<string, number>();
  for (let i = -CHART_DAYS_BEFORE; i <= CHART_DAYS_AFTER; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    buckets.set(toDateKey(d), 0);
  }
  for (const b of chartRows) {
    const key = toDateKey(b.date);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const chartData: ChartPoint[] = [...buckets.entries()].map(([key, count]) => {
    const d = new Date(key);
    return {
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      count,
      isToday: key === toDateKey(today),
    };
  });

  return (
    <div>
      <PageHeader
        title="Overview"
        badge={
          <span
            title="Bookings placed today — resets to 0 each new day"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"
          >
            <BellRing className="h-3.5 w-3.5" />
            {todayCreatedCount} booked today
          </span>
        }
        subtitle={now.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        action={
          <div className="inline-flex rounded-xl border border-surface-border bg-surface-sunken/40 p-1">
            {PERIODS.map((p) => (
              <Link
                key={p.key}
                href={p.key === "all" ? "/admin" : `/admin?period=${p.key}`}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                  period === p.key
                    ? "bg-gold-gradient text-brand-950"
                    : "text-content-muted hover:text-content"
                )}
              >
                {p.label}
              </Link>
            ))}
          </div>
        }
      />

      {/* Stat cards — scoped to the selected period above */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Bookings"
          value={periodStats._count._all}
          hint={`${periodLabel[0].toUpperCase()}${periodLabel.slice(1)}`}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="gold"
        />
        <StatCard
          label="Guests"
          value={totalGuests}
          hint={`${periodLabel[0].toUpperCase()}${periodLabel.slice(1)}`}
          icon={<Users className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Chart */}
        <div className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-content">
              Bookings — 5 Days Before &amp; After Today
            </h2>
            <span className="text-xs text-content-dim">Active reservations</span>
          </div>
          <AdminChart data={chartData} />
        </div>

        {/* Today's timeline */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-lg font-semibold text-content">Today&apos;s Timeline</h2>
          </div>

          {todaysTimeline.length === 0 ? (
            <EmptyState title="No bookings today" description="New reservations will appear here." />
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {todaysTimeline.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-sunken/30 px-3 py-2.5"
                >
                  <span className="grid h-11 w-14 shrink-0 place-items-center rounded-lg bg-gold/10 text-xs font-semibold text-gold">
                    {formatTime12h(b.timeSlot)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{b.guestName}</p>
                    <p className="truncate text-xs text-content-dim">
                      {b.location.name} · {b.partySize} guests
                    </p>
                  </div>
                  <StatusBadge status={b.status as BookingStatus} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
