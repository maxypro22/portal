import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { updateBookingSchema } from "@/lib/validations";
import { isSlotAvailable } from "@/lib/booking";
import { DEFAULT_DURATION_MINUTES } from "@/lib/constants";
import { fromDateKey } from "@/lib/utils";

type Params = { params: { id: string } };

/** GET /api/bookings/[id] — admin single booking. */
export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { location: true, table: true },
    });
    if (!booking) return apiError("Booking not found.", 404);
    return apiOk(booking);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** PATCH /api/bookings/[id] — admin update (status change, edit, reschedule). */
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = updateBookingSchema.parse(body);

    const existing = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!existing) return apiError("Booking not found.", 404);

    // If rescheduling (table/date/time change), re-check for conflicts.
    const rescheduling =
      data.tableId !== undefined || data.date !== undefined || data.timeSlot !== undefined;

    if (rescheduling) {
      const tableId = data.tableId ?? existing.tableId;
      const dateKey =
        data.date ??
        `${existing.date.getFullYear()}-${(existing.date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${existing.date.getDate().toString().padStart(2, "0")}`;
      const timeSlot = data.timeSlot ?? existing.timeSlot;

      // Capacity check when moving tables.
      if (data.tableId) {
        const table = await prisma.table.findUnique({ where: { id: data.tableId } });
        if (!table) return apiError("Target table not found.", 400);
        const partySize = data.partySize ?? existing.partySize;
        if (partySize > table.capacity) {
          return apiError(`Table ${table.number} seats only ${table.capacity}.`, 400);
        }
      }

      const free = await isSlotAvailable({
        locationId: existing.locationId,
        tableId,
        dateKey,
        timeSlot,
        durationMinutes: DEFAULT_DURATION_MINUTES,
        ignoreBookingId: existing.id,
      });
      if (!free) return apiError("That table/time is already booked.", 409);
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        ...data,
        date: data.date ? fromDateKey(data.date) : undefined,
      },
      include: {
        location: { select: { id: true, name: true } },
        table: { select: { id: true, number: true, capacity: true, section: true } },
      },
    });
    return apiOk(updated);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** DELETE /api/bookings/[id] — admin delete. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    await prisma.booking.delete({ where: { id: params.id } });
    return apiOk({ id: params.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
