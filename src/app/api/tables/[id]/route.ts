import { prisma } from "@/lib/prisma";
import { apiOk, handleRouteError, requireAdmin } from "@/lib/api";
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

/** DELETE /api/tables/[id] — admin delete. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    await prisma.table.delete({ where: { id: params.id } });
    return apiOk({ id: params.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
