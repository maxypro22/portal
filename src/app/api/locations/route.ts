import { prisma } from "@/lib/prisma";
import { apiOk, handleRouteError, requireAdmin } from "@/lib/api";
import { locationSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * GET /api/locations
 *   default   → public list of ACTIVE locations (with table counts)
 *   ?all=1    → admin-only: includes inactive locations
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";
    if (all) await requireAdmin();

    const locations = await prisma.location.findMany({
      where: all ? {} : { isActive: true },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { tables: true, bookings: true } } },
    });
    return apiOk(locations);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/locations — admin create. */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = locationSchema.parse(body);
    const location = await prisma.location.create({
      data: { ...data, imageUrl: data.imageUrl || null },
    });
    return apiOk(location, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
