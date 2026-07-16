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

/**
 * DELETE /api/locations/[id] — admin delete.
 * The schema cascades: deleting a location deletes every table AND every
 * booking ever made there. Block that if ANY booking exists (not just
 * active ones) — deactivate instead so historical records are preserved.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const bookingCount = await prisma.booking.count({ where: { locationId: params.id } });
    if (bookingCount > 0) {
      return apiError(
        `Cannot delete: ${bookingCount} booking(s) reference this location (including past history). Set it to inactive instead to keep records intact.`,
        409
      );
    }
    await prisma.location.delete({ where: { id: params.id } });
    return apiOk({ id: params.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
