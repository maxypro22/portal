import { CalendarCheck, CalendarClock, Users, Gauge, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/admin/AdminUI";
import { AdminChart, type ChartPoint } from "@/components/admin/AdminChart";
import { StatusBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Primitives";
import { formatTime12h, toDateKey } from "@/lib/utils";
import type { BookingStatus } from "@/lib/constants";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic"; // always fresh dashboard data

const ACTIVE: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function OverviewPage() {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // --- Parallel data fetch ---
  const [
    todayBookings,
    upcomingCount,
    totalActiveTables,
    last14,
    todaysTimeline,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { date: today, status: { in: ACTIVE } },
      select: { partySize: true, tableId: true },
    }),
    prisma.booking.count({
      where: { date: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.table.count({ where: { isActive: true } }),
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

  const totalGuestsToday = todayBookings.reduce((sum, b) => sum + b.partySize, 0);
  const distinctTablesToday = new Set(todayBookings.map((b) => b.tableId)).size;
  const occupancy =
    totalActiveTables > 0
      ? Math.min(100, Math.round((distinctTablesToday / totalActiveTables) * 100))
      : 0;

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
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Bookings"
          value={todayBookings.length}
          hint={`${distinctTablesToday} tables in use`}
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
          label="Guests Today"
          value={totalGuestsToday}
          hint="Across all covers"
          icon={<Users className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="Occupancy"
          value={`${occupancy}%`}
          hint={`${distinctTablesToday}/${totalActiveTables} tables`}
          icon={<Gauge className="h-5 w-5" />}
          accent="purple"
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
