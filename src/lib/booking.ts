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
 * Auto-assign the best-fit table for a party: the smallest active table at
 * the location that seats `partySize`. Guests choose their own preferred
 * time freely (no slot/availability restriction) — a table is still
 * attached to every booking for internal record-keeping, but its assignment
 * is purely nominal and never blocks a reservation. Returns null only when
 * the location has no table large enough for the party at all.
 */
export async function pickAvailableTable(
  params: { locationId: string; partySize: number },
  db: DbClient
): Promise<{ id: string; number: number; capacity: number; section: string } | null> {
  const table = await db.table.findFirst({
    where: { locationId: params.locationId, isActive: true, capacity: { gte: params.partySize } },
    orderBy: { capacity: "asc" },
    select: { id: true, number: true, capacity: true, section: true },
  });
  return table ?? null;
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
