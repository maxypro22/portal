import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import { DEFAULT_DURATION_MINUTES } from "./constants";
import { fromDateKey, intervalsOverlap, timeToMinutes } from "./utils";

/** Statuses that still occupy a table (block the slot). */
export const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED"] as const;

/**
 * Accepts either the shared PrismaClient singleton or a `$transaction`
 * callback's `tx` handle, so availability checks can run either standalone
 * (read-only endpoints) or inside a serializable transaction (booking writes).
 */
type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Return the set of tableIds that are unavailable for a given location/date,
 * because an existing active booking's [start, start+duration) window overlaps
 * the requested window. When `timeSlot` is omitted, returns tables that have
 * ANY active booking that day (used by the admin live-floor view per slot).
 */
export async function getUnavailableTableIds(
  params: {
    locationId: string;
    dateKey: string; // YYYY-MM-DD
    timeSlot?: string; // HH:mm — the window we want to book
    durationMinutes?: number;
    ignoreBookingId?: string; // when editing, don't clash with self
  },
  db: DbClient = prisma
): Promise<Set<string>> {
  const {
    locationId,
    dateKey,
    timeSlot,
    durationMinutes = DEFAULT_DURATION_MINUTES,
    ignoreBookingId,
  } = params;

  const date = fromDateKey(dateKey);

  const bookings = await db.booking.findMany({
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
export async function getOccupiedTableIdsAt(
  params: {
    locationId: string;
    dateKey: string;
    atMinutes: number;
  },
  db: DbClient = prisma
): Promise<Set<string>> {
  const { locationId, dateKey, atMinutes } = params;
  const date = fromDateKey(dateKey);

  const bookings = await db.booking.findMany({
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
 *
 * NOTE: on its own this has a check-then-act race window under concurrent
 * requests. Callers that create a booking off the back of this check MUST
 * run both inside a single Serializable transaction (see POST /api/bookings)
 * so Postgres itself rejects a conflicting concurrent write rather than
 * relying solely on this read.
 */
export async function isSlotAvailable(
  params: {
    locationId: string;
    tableId: string;
    dateKey: string;
    timeSlot: string;
    durationMinutes?: number;
    ignoreBookingId?: string;
  },
  db: DbClient = prisma
): Promise<boolean> {
  const unavailable = await getUnavailableTableIds(
    {
      locationId: params.locationId,
      dateKey: params.dateKey,
      timeSlot: params.timeSlot,
      durationMinutes: params.durationMinutes,
      ignoreBookingId: params.ignoreBookingId,
    },
    db
  );
  return !unavailable.has(params.tableId);
}

/**
 * Thrown for expected, user-facing booking failures (e.g. table too small,
 * slot no longer free) so route handlers can map them straight to a clean
 * HTTP status/message instead of a generic 500 — distinct from unexpected
 * errors, which still fall through to handleRouteError().
 */
export class BookingRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "BookingRequestError";
    this.status = status;
  }
}

/**
 * Run `fn` inside a SERIALIZABLE transaction, retrying a bounded number of
 * times if Postgres detects a write conflict with a concurrent transaction
 * (Prisma surfaces this as error code P2034).
 *
 * This is what actually prevents two simultaneous requests from both booking
 * the same table/slot: isSlotAvailable()'s read-then-decide pattern alone has
 * a race window between the check and the insert. Wrapping both in a single
 * Serializable transaction makes Postgres itself abort one of the two
 * conflicting transactions — the retry then re-runs the check, which will
 * correctly see the other request's now-committed booking.
 */
export async function runSerializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (err) {
      const isSerializationConflict =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
      if (isSerializationConflict && attempt < maxRetries) continue;
      throw err;
    }
  }
}
