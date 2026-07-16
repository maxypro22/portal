import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { locationSchema } from "@/lib/validations";

type Params = { params: { id: string } };

/** PATCH /api/locations/[id] — admin update. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = locationSchema.partial().parse(body);
    const location = await prisma.location.update({
      where: { id: params.id },
      data: { ...data, imageUrl: data.imageUrl ?? undefined },
    });
    return apiOk(location);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** DELETE /api/locations/[id] — admin delete (cascades tables + bookings). */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const bookingCount = await prisma.booking.count({
      where: { locationId: params.id, status: { in: ["PENDING", "CONFIRMED"] } },
    });
    if (bookingCount > 0) {
      return apiError(
        `Cannot delete: ${bookingCount} active booking(s) exist for this location.`,
        409
      );
    }
    await prisma.location.delete({ where: { id: params.id } });
    return apiOk({ id: params.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
