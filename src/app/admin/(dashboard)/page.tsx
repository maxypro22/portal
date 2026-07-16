import Link from "next/link";
import { CalendarCheck, CalendarClock, Users, Clock } from "lucide-react";
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

const PERIODS = [
  { key: "all", label: "All" },
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Date range for the selected stat-card period. `start`/`end` are both null
 * for "all" — the queries below treat that as "no date filter," i.e. the
 * all-time total, which is what "remove the filter" should show.
 */
function getPeriodRange(period: PeriodKey, today: Date) {
  if (period === "day") return { start: today, end: today, label: "today" };
  if (period === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // back to Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end, label: "this week" };
  }
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

  const period: PeriodKey = PERIODS.some((p) => p.key === searchParams.period)
    ? (searchParams.period as PeriodKey)
    : "all";
  const { start, end, label: periodLabel } = getPeriodRange(period, today);
  const periodDateFilter = start && end ? { date: { gte: start, lte: end } } : {};

  // --- Parallel data fetch ---
  const [periodBookings, upcomingCount, last14, todaysTimeline] = await Promise.all([
    prisma.booking.findMany({
      where: { ...periodDateFilter, status: { in: ACTIVE } },
      select: { partySize: true },
    }),
    prisma.booking.count({
      where: {
        date: { gte: today, ...(end ? { lte: end } : {}) },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.booking.findMany({
      where: {
        date: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13) },
        status: { in: ACTIVE },
      },
      select: { date: true },
    }),
    prisma.booking.findMany({
      where: { date: today },
      orderBy: { timeSlot: "asc" },
      include: {
        table: { select: { number: true, section: true } },
        location: { select: { name: true } },
      },
    }),
  ]);

  const totalGuests = periodBookings.reduce((sum, b) => sum + b.partySize, 0);

  // Build 14-day chart buckets
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    buckets.set(toDateKey(d), 0);
  }
  for (const b of last14) {
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
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Bookings"
          value={periodBookings.length}
          hint={`${periodLabel[0].toUpperCase()}${periodLabel.slice(1)}`}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="gold"
        />
        <StatCard
          label="Upcoming"
          value={upcomingCount}
          hint="Pending & confirmed"
          icon={<CalendarClock className="h-5 w-5" />}
          accent="green"
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
            <h2 className="font-serif text-lg font-semibold text-content">Bookings — Last 14 Days</h2>
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
                      Table {b.table.number} · {b.partySize} guests
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
