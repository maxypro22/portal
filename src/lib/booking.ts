import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

/** Statuses considered "on the books" (shown on the admin dashboard, etc.). */
export const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED"] as const;

/**
 * Accepts either the shared PrismaClient singleton or a `$transaction`
 * callback's `tx` handle.
 */
type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Auto-assign a table for a party: the smallest active table that seats
 * `partySize`, or — for a party larger than any single table — the largest
 * active table available, best-effort. Guests choose their own preferred
 * time freely (no slot/availability restriction), and party size never
 * blocks a reservation either; a table is attached to every booking purely
 * for internal record-keeping. Returns null only if the location has no
 * active table at all.
 */
export async function pickAvailableTable(
  params: { locationId: string; partySize: number },
  db: DbClient
): Promise<{ id: string; number: number; capacity: number; section: string } | null> {
  const fitting = await db.table.findFirst({
    where: { locationId: params.locationId, isActive: true, capacity: { gte: params.partySize } },
    orderBy: { capacity: "asc" },
    select: { id: true, number: true, capacity: true, section: true },
  });
  if (fitting) return fitting;

  // No single table seats the whole party — fall back to the largest
  // active table rather than rejecting the booking.
  const largest = await db.table.findFirst({
    where: { locationId: params.locationId, isActive: true },
    orderBy: { capacity: "desc" },
    select: { id: true, number: true, capacity: true, section: true },
  });
  return largest ?? null;
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
 * Keeps table assignment + booking creation atomic under concurrent
 * requests, and Postgres retries a conflicting concurrent write for us
 * rather than surfacing a hard error.
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
