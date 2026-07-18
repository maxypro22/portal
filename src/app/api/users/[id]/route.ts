import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validations";

type Params = { params: { id: string } };

const SAFE_SELECT = { id: true, name: true, email: true, role: true, createdAt: true } as const;

/** PATCH /api/users/[id] — admin: change a user's password. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { password } = changePasswordSchema.parse(body);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { hashedPassword },
      select: SAFE_SELECT,
    });
    return apiOk(user);
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * DELETE /api/users/[id] — admin: remove a login account.
 * Guarded against locking everyone out: can't delete the last remaining
 * account, and can't delete the account you're currently signed in as.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await requireAdmin();
    const currentUserId = (session.user as { id?: string }).id;

    if (currentUserId === params.id) {
      return apiError("You can't delete the account you're currently signed in as.", 400);
    }

    const totalUsers = await prisma.user.count();
    if (totalUsers <= 1) {
      return apiError("Can't delete the last remaining admin account.", 400);
    }

    await prisma.user.delete({ where: { id: params.id } });
    return apiOk({ id: params.id });
  } catch (err) {
    return handleRouteError(err);
  }
}
