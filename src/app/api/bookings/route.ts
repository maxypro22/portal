import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { createBookingSchema } from "@/lib/validations";
import { BookingRequestError, isSlotAvailable, runSerializable } from "@/lib/booking";
import { DEFAULT_DURATION_MINUTES } from "@/lib/constants";
import {
  fromDateKey,
  generateReference,
  generateSlotsForDay,
  timeToMinutes,
  toDateKey,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings — ADMIN list with search, filters, pagination.
 * Query: q, status, locationId, date (YYYY-MM-DD), page, pageSize
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const locationId = searchParams.get("locationId") ?? "";
    const date = searchParams.get("date") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") ?? "10", 10)));

    const where: Prisma.BookingWhereInput = {};
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) where.date = fromDateKey(date);
    if (q) {
      // case-insensitive search (Postgres ILIKE)
      const insensitive = { contains: q, mode: "insensitive" as const };
      where.OR = [
        { reference: insensitive },
        { guestName: insensitive },
        { guestPhone: insensitive },
        { guestEmail: insensitive },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          location: { select: { id: true, name: true } },
          table: { select: { id: true, number: true, capacity: true, section: true } },
        },
      }),
    ]);

    return apiOk({
      bookings,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * POST /api/bookings — PUBLIC create.
 * Validates capacity, working hours, past-time, and prevents double-booking.
 *
 * The table lookup, availability check, and insert all run inside a single
 * Serializable transaction (see runSerializable) so two guests booking the
 * same table/slot at the exact same moment can't both succeed — Postgres
 * itself rejects one of the conflicting transactions, which we retry.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createBookingSchema.parse(body);

    // --- Checks that don't need the database: fail fast, no transaction. ---
    const day = fromDateKey(input.date);
    const validSlots = generateSlotsForDay(day.getDay(), DEFAULT_DURATION_MINUTES);
    if (!validSlots.includes(input.timeSlot)) {
      return apiError("Selected time is outside our working hours.", 400);
    }

    const now = new Date();
    if (toDateKey(now) === input.date) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (timeToMinutes(input.timeSlot) <= nowMinutes) {
        return apiError("Selected time has already passed.", 400);
      }
    }
    if (day < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return apiError("Cannot book a date in the past.", 400);
    }

    const year = day.getFullYear();

    const booking = await runSerializable(async (tx) => {
      // 1) Table must exist, be active, and belong to the location.
      const table = await tx.table.findUnique({ where: { id: input.tableId } });
      if (!table || table.locationId !== input.locationId) {
        throw new BookingRequestError("Selected table is not valid for this location.", 400);
      }
      if (!table.isActive) {
        throw new BookingRequestError("Selected table is not available for booking.", 400);
      }

      // 2) Party size must fit the table.
      if (input.partySize > table.capacity) {
        throw new BookingRequestError(
          `This table seats ${table.capacity}. Please choose a larger table.`,
          400
        );
      }

      // 3) Double-booking guard (2-hour overlap) — checked and written inside
      //    the same transaction, closing the race window a plain read+write
      //    would have under concurrent requests.
      const free = await isSlotAvailable(
        {
          locationId: input.locationId,
          tableId: input.tableId,
          dateKey: input.date,
          timeSlot: input.timeSlot,
          durationMinutes: DEFAULT_DURATION_MINUTES,
        },
        tx
      );
      if (!free) {
        throw new BookingRequestError(
          "Sorry, that table has just been booked for this time. Please pick another slot.",
          409
        );
      }

      // 4) Create with a unique reference (retry on rare collision).
      for (let attempt = 0; attempt < 5; attempt++) {
        const reference = generateReference(year);
        try {
          return await tx.booking.create({
            data: {
              reference,
              locationId: input.locationId,
              tableId: input.tableId,
              guestName: input.guestName,
              guestPhone: input.guestPhone,
              guestEmail: input.guestEmail,
              partySize: input.partySize,
              date: day,
              timeSlot: input.timeSlot,
              durationMinutes: DEFAULT_DURATION_MINUTES,
              status: "PENDING",
              specialRequests: input.specialRequests || null,
            },
            include: {
              location: { select: { name: true, address: true } },
              table: { select: { number: true, capacity: true, section: true } },
            },
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
          throw e;
        }
      }

      throw new BookingRequestError("Could not generate a booking reference. Try again.", 500);
    });

    return apiOk(booking, 201);
  } catch (err) {
    if (err instanceof BookingRequestError) return apiError(err.message, err.status);
    return handleRouteError(err);
  }
}
