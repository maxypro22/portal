import { prisma } from "@/lib/prisma";
import { apiOk, handleRouteError, requireAdmin } from "@/lib/api";

type Params = { params: { id: string } };

/** DELETE /api/notification-emails/[id] — admin: remove a recipient address. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    await prisma.notificationEmail.delete({ where: { id: params.id } });
    return apiOk({ id: params.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
