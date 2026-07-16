import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { createBookingSchema } from "@/lib/validations";
import { BookingRequestError, pickAvailableTable, runSerializable } from "@/lib/booking";
import { getWorkingHours } from "@/lib/hours";
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
 * Guests choose location, party size, date, and time only — a table is
 * auto-assigned (smallest fitting, available table) inside the same
 * Serializable transaction that creates the booking, so two guests
 * requesting the same slot can't both be handed the same table.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createBookingSchema.parse(body);

    const day = fromDateKey(input.date);
    const hoursMap = await getWorkingHours();
    const validSlots = generateSlotsForDay(day.getDay(), DEFAULT_DURATION_MINUTES, hoursMap);
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
      // 1) Auto-assign the best-fit, available table for this party/slot.
      const table = await pickAvailableTable(
        {
          locationId: input.locationId,
          partySize: input.partySize,
          dateKey: input.date,
          timeSlot: input.timeSlot,
          durationMinutes: DEFAULT_DURATION_MINUTES,
        },
        tx
      );
      if (!table) {
        throw new BookingRequestError(
          "Sorry, no table is available for that party size at this time. Please try another time or date.",
          409
        );
      }

      // 2) Create with a unique reference (retry on rare collision).
      for (let attempt = 0; attempt < 5; attempt++) {
        const reference = generateReference(year);
        try {
          return await tx.booking.create({
            data: {
              reference,
              locationId: input.locationId,
              tableId: table.id,
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
