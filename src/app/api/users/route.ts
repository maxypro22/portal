import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { createUserSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const SAFE_SELECT = { id: true, name: true, email: true, role: true, createdAt: true } as const;

/** GET /api/users — admin: list dashboard login accounts (no password hashes). */
export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: { createdAt: "asc" },
    });
    return apiOk(users);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/users — admin: create a new dashboard login (name, email, password). */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return apiError("A user with that email already exists.", 409);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, hashedPassword, role: "ADMIN" },
      select: SAFE_SELECT,
    });
    return apiOk(user, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
