import { prisma } from "./prisma";
import { DEFAULT_DURATION_MINUTES } from "./constants";
import { fromDateKey, intervalsOverlap, timeToMinutes } from "./utils";

/** Statuses that still occupy a table (block the slot). */
export const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED"] as const;

/**
 * Return the set of tableIds that are unavailable for a given location/date,
 * because an existing active booking's [start, start+duration) window overlaps
 * the requested window. When `timeSlot` is omitted, returns tables that have
 * ANY active booking that day (used by the admin live-floor view per slot).
 */
export async function getUnavailableTableIds(params: {
  locationId: string;
  dateKey: string; // YYYY-MM-DD
  timeSlot?: string; // HH:mm — the window we want to book
  durationMinutes?: number;
  ignoreBookingId?: string; // when editing, don't clash with self
}): Promise<Set<string>> {
  const {
    locationId,
    dateKey,
    timeSlot,
    durationMinutes = DEFAULT_DURATION_MINUTES,
    ignoreBookingId,
  } = params;

  const date = fromDateKey(dateKey);

  const bookings = await prisma.booking.findMany({
    where: {
      locationId,
      date,
      status: { in: [...ACTIVE_STATUSES] },
      ...(ignoreBookingId ? { id: { not: ignoreBookingId } } : {}),
    },
    select: { tableId: true, timeSlot: true, durationMinutes: true },
  });

  // No specific slot: any active booking blocks the table for the day view.
  if (!timeSlot) {
    return new Set(bookings.map((b) => b.tableId));
  }

  const reqStart = timeToMinutes(timeSlot);
  const reqEnd = reqStart + durationMinutes;

  const unavailable = new Set<string>();
  for (const b of bookings) {
    const bStart = timeToMinutes(b.timeSlot);
    const bEnd = bStart + b.durationMinutes;
    if (intervalsOverlap(reqStart, reqEnd, bStart, bEnd)) {
      unavailable.add(b.tableId);
    }
  }
  return unavailable;
}

/**
 * Return the tableIds that are occupied at a specific moment (admin live floor).
 * A table is "occupied" if an active booking's window contains `atMinutes`.
 */
export async function getOccupiedTableIdsAt(params: {
  locationId: string;
  dateKey: string;
  atMinutes: number;
}): Promise<Set<string>> {
  const { locationId, dateKey, atMinutes } = params;
  const date = fromDateKey(dateKey);

  const bookings = await prisma.booking.findMany({
    where: {
      locationId,
      date,
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: { tableId: true, timeSlot: true, durationMinutes: true },
  });

  const occupied = new Set<string>();
  for (const b of bookings) {
    const start = timeToMinutes(b.timeSlot);
    const end = start + b.durationMinutes;
    if (atMinutes >= start && atMinutes < end) occupied.add(b.tableId);
  }
  return occupied;
}

/**
 * Authoritative double-booking guard used at write time.
 * Returns true when the requested table/slot is free.
 */
export async function isSlotAvailable(params: {
  locationId: string;
  tableId: string;
  dateKey: string;
  timeSlot: string;
  durationMinutes?: number;
  ignoreBookingId?: string;
}): Promise<boolean> {
  const unavailable = await getUnavailableTableIds({
    locationId: params.locationId,
    dateKey: params.dateKey,
    timeSlot: params.timeSlot,
    durationMinutes: params.durationMinutes,
    ignoreBookingId: params.ignoreBookingId,
  });
  return !unavailable.has(params.tableId);
}
