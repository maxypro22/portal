import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { createBookingSchema } from "@/lib/validations";
import { isSlotAvailable } from "@/lib/booking";
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

    const where: Record<string, unknown> = {};
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
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createBookingSchema.parse(body);

    // 1) Table must exist, be active, and belong to the location.
    const table = await prisma.table.findUnique({ where: { id: input.tableId } });
    if (!table || table.locationId !== input.locationId) {
      return apiError("Selected table is not valid for this location.", 400);
    }
    if (!table.isActive) {
      return apiError("Selected table is not available for booking.", 400);
    }

    // 2) Party size must fit the table.
    if (input.partySize > table.capacity) {
      return apiError(
        `This table seats ${table.capacity}. Please choose a larger table.`,
        400
      );
    }

    // 3) Time slot must be valid for that weekday's working hours.
    const day = fromDateKey(input.date);
    const validSlots = generateSlotsForDay(day.getDay(), DEFAULT_DURATION_MINUTES);
    if (!validSlots.includes(input.timeSlot)) {
      return apiError("Selected time is outside our working hours.", 400);
    }

    // 4) Not in the past.
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

    // 5) Double-booking guard (2-hour overlap).
    const free = await isSlotAvailable({
      locationId: input.locationId,
      tableId: input.tableId,
      dateKey: input.date,
      timeSlot: input.timeSlot,
      durationMinutes: DEFAULT_DURATION_MINUTES,
    });
    if (!free) {
      return apiError(
        "Sorry, that table has just been booked for this time. Please pick another slot.",
        409
      );
    }

    // 6) Create with a unique reference (retry on rare collision).
    const year = day.getFullYear();
    let booking = null;
    for (let attempt = 0; attempt < 5 && !booking; attempt++) {
      const reference = generateReference(year);
      try {
        booking = await prisma.booking.create({
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
        // reference collision → retry; anything else → bubble up
        if (typeof e === "object" && e && "code" in e && (e as { code?: string }).code === "P2002") {
          continue;
        }
        throw e;
      }
    }

    if (!booking) return apiError("Could not generate a booking reference. Try again.", 500);
    return apiOk(booking, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
