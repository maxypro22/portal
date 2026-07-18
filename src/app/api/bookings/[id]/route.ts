import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { updateBookingSchema } from "@/lib/validations";
import { BookingRequestError, runSerializable } from "@/lib/booking";
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

/**
 * PATCH /api/bookings/[id] — admin update (status change, edit, reschedule).
 * There's no availability/overlap restriction — date, time, and table can be
 * changed freely. If the table is explicitly reassigned, only its seating
 * capacity is checked against the party size.
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = updateBookingSchema.parse(body);

    const updated = await runSerializable(async (tx) => {
      const existing = await tx.booking.findUnique({ where: { id: params.id } });
      if (!existing) throw new BookingRequestError("Booking not found.", 404);

      if (data.tableId) {
        const table = await tx.table.findUnique({ where: { id: data.tableId } });
        if (!table) throw new BookingRequestError("Target table not found.", 400);
        const partySize = data.partySize ?? existing.partySize;
        if (partySize > table.capacity) {
          throw new BookingRequestError(`Table ${table.number} seats only ${table.capacity}.`, 400);
        }
      }

      return tx.booking.update({
        where: { id: params.id },
        data: {
          ...data,
          guestEmail: data.guestEmail !== undefined ? data.guestEmail || null : undefined,
          date: data.date ? fromDateKey(data.date) : undefined,
        },
        include: {
          location: { select: { id: true, name: true } },
          table: { select: { id: true, number: true, capacity: true, section: true } },
        },
      });
    });

    return apiOk(updated);
  } catch (err) {
    if (err instanceof BookingRequestError) return apiError(err.message, err.status);
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
