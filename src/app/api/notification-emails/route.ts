import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { notificationEmailSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** GET /api/notification-emails — admin: list addresses that get a copy of every booking email. */
export async function GET() {
  try {
    await requireAdmin();
    const emails = await prisma.notificationEmail.findMany({ orderBy: { createdAt: "asc" } });
    return apiOk(emails);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/notification-emails — admin: add a recipient address. */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = notificationEmailSchema.parse(body);

    const existing = await prisma.notificationEmail.findUnique({ where: { email: data.email } });
    if (existing) return apiError("That email is already on the list.", 409);

    const created = await prisma.notificationEmail.create({
      data: { email: data.email, label: data.label || null },
    });
    return apiOk(created, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
