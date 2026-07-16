import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError } from "@/lib/api";
import { getUnavailableTableIds } from "@/lib/booking";
import { DEFAULT_DURATION_MINUTES } from "@/lib/constants";
import {
  fromDateKey,
  generateSlotsForDay,
  timeToMinutes,
  toDateKey,
} from "@/lib/utils";

// Reads query params at request time — never statically prerender.
export const dynamic = "force-dynamic";

/**
 * GET /api/availability?locationId=&date=YYYY-MM-DD[&tableId=][&timeSlot=HH:mm]
 *
 * Returns:
 *  - slots:               generated 30-min start slots for that weekday,
 *                         each { time, past, available }
 *                         (`available` = free for `tableId` if provided, else true)
 *  - unavailableTableIds: table ids blocked for `timeSlot` (if provided)
 *
 * Availability honours the 2-hour dining window overlap rule.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const date = searchParams.get("date");
    const tableId = searchParams.get("tableId") ?? undefined;
    const timeSlot = searchParams.get("timeSlot") ?? undefined;

    if (!locationId || !date) {
      return apiError("locationId and date are required", 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return apiError("date must be YYYY-MM-DD", 400);
    }

    const day = fromDateKey(date);
    const dayOfWeek = day.getDay();
    const slotTimes = generateSlotsForDay(dayOfWeek, DEFAULT_DURATION_MINUTES);

    // "past" detection for today's slots
    const now = new Date();
    const isToday = toDateKey(now) === date;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // All active bookings for the day (one query), to compute per-slot availability.
    const dayBookings = await prisma.booking.findMany({
      where: {
        locationId,
        date: day,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        ...(tableId ? { tableId } : {}),
      },
      select: { tableId: true, timeSlot: true, durationMinutes: true },
    });

    const slots = slotTimes.map((time) => {
      const start = timeToMinutes(time);
      const end = start + DEFAULT_DURATION_MINUTES;
      const past = isToday && start <= nowMinutes;

      // If a table is specified, the slot is available only if that table has
      // no overlapping active booking. Without a table, we report open.
      let available = true;
      if (tableId) {
        available = !dayBookings.some((b) => {
          const bStart = timeToMinutes(b.timeSlot);
          const bEnd = bStart + b.durationMinutes;
          return start < bEnd && bStart < end;
        });
      }
      return { time, past, available: available && !past };
    });

    // Optional: which tables are blocked for a concrete window (floor plan dim).
    let unavailableTableIds: string[] = [];
    if (timeSlot) {
      const set = await getUnavailableTableIds({
        locationId,
        dateKey: date,
        timeSlot,
        durationMinutes: DEFAULT_DURATION_MINUTES,
      });
      unavailableTableIds = [...set];
    }

    return apiOk({ date, dayOfWeek, slots, unavailableTableIds });
  } catch (err) {
    return handleRouteError(err);
  }
}
