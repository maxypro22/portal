import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { createBookingSchema } from "@/lib/validations";
import { BookingRequestError, pickAvailableTable, runSerializable } from "@/lib/booking";
import { sendBookingConfirmationEmails } from "@/lib/email";
import { getLastSeatingBufferMinutes, getWorkingHours } from "@/lib/hours";
import { DEFAULT_DURATION_MINUTES } from "@/lib/constants";
import { fromDateKey, generateReference, qatarNow, timeToMinutes } from "@/lib/utils";

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
 * Guests enter their own preferred time freely — there's no slot list, no
 * availability/overlap restriction, and no "already passed" restriction on
 * today's times either (guests can pick any time of day, no limit). The
 * only time constraint is that it falls within working hours, with last
 * seating getLastSeatingBufferMinutes() before close (the 2-hour dining
 * window may run past closing time — normal restaurant practice). A table
 * is still auto-assigned (smallest fitting one) for internal record-
 * keeping, but its assignment never blocks the reservation.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createBookingSchema.parse(body);

    const day = fromDateKey(input.date);
    const [hoursMap, lastSeatingBufferMinutes] = await Promise.all([
      getWorkingHours(),
      getLastSeatingBufferMinutes(),
    ]);
    const dayHours = hoursMap[day.getDay()];
    if (!dayHours) {
      return apiError("We're closed on the selected date.", 400);
    }
    const requestedMinutes = timeToMinutes(input.timeSlot);
    const lastStart = dayHours.close - lastSeatingBufferMinutes;
    if (requestedMinutes < dayHours.open || requestedMinutes > lastStart) {
      return apiError("Selected time is outside our working hours.", 400);
    }

    const now = qatarNow();
    if (day < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      return apiError("Cannot book a date in the past.", 400);
    }

    const year = day.getFullYear();

    const booking = await runSerializable(async (tx) => {
      // 1) Auto-assign the best-fit table for this party size (record-keeping
      // only — never blocks the booking).
      const table = await pickAvailableTable(
        { locationId: input.locationId, partySize: input.partySize },
        tx
      );
      if (!table) {
        throw new BookingRequestError(
          "This location isn't set up to accept bookings yet. Please try another location.",
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
              guestEmail: input.guestEmail || null,
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

    // Never lets an email failure affect the booking response — see
    // sendBookingConfirmationEmails' own try/catch handling.
    await sendBookingConfirmationEmails({
      reference: booking.reference,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      partySize: booking.partySize,
      date: booking.date,
      timeSlot: booking.timeSlot,
      specialRequests: booking.specialRequests,
      location: booking.location,
    });

    return apiOk(booking, 201);
  } catch (err) {
    if (err instanceof BookingRequestError) return apiError(err.message, err.status);
    return handleRouteError(err);
  }
}
