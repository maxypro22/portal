import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { tableSchema } from "@/lib/validations";

type Params = { params: { id: string } };

/** PATCH /api/tables/[id] — admin update. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = tableSchema.partial().parse(body);
    const table = await prisma.table.update({ where: { id: params.id }, data });
    return apiOk(table);
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * DELETE /api/tables/[id] — admin delete.
 * The schema cascades: deleting a table deletes every booking that ever
 * referenced it. Block that if any booking (including past/completed
 * history) exists — deactivate instead to preserve records.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const bookingCount = await prisma.booking.count({ where: { tableId: params.id } });
    if (bookingCount > 0) {
      return apiError(
        `Cannot delete: ${bookingCount} booking(s) reference this table (including past history). Set it to inactive instead to keep records intact.`,
        409
      );
    }
    await prisma.table.delete({ where: { id: params.id } });
    return apiOk({ id: params.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
